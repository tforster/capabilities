// install.js — symlink-based install/uninstall for every capabilities trait category
//
// All three trait categories (skills, agents, rules) use the same plain
// directory-symlink model — see prd.md §4.1.

// System dependencies
import { mkdir, symlink, lstat, unlink, readlink } from "node:fs/promises";
import path from "node:path";

/**
 * Maps each trait category to its source directory within the capabilities
 * repo. Every category is a directory symlink (prd.md §4.1).
 *
 * @param {string} capabilitiesRoot - Absolute path to the capabilities repo root.
 * @returns {Record<string, string>} Category name to source directory.
 */
export function symlinkCategories(capabilitiesRoot) {
  return {
    skills: path.join(capabilitiesRoot, "traits", "skills"),
    agents: path.join(capabilitiesRoot, "traits", "agents"),
    rules: path.join(capabilitiesRoot, "traits", "rules"),
  };
}

/**
 * Installs a harness's trait categories (skills, agents, rules), pointing
 * them at the capabilities repo. A category absent from the harness's
 * config is treated as not applicable and skipped.
 *
 * @param {string} harnessName - Key of the harness in `config.harnesses`.
 * @param {{config: import("./types.js").CapabilitiesConfig, capabilitiesRoot: string}} options - Parsed capabilities.yaml and repo root.
 * @returns {Promise<void>}
 */
export async function install(harnessName, { config, capabilitiesRoot }) {
  const harness = requireHarness(config, harnessName);
  const categories = symlinkCategories(capabilitiesRoot);

  const applicable = Object.entries(categories).filter(([name]) => harness[name]);

  // Validate every applicable category before touching any of them, so a
  // conflict discovered partway through never leaves a partial install.
  const plan = [];
  for (const [name, source] of applicable) {
    const targetPath = harness[name];
    const existing = await existingLinkTarget(targetPath);

    if (existing.isSymlink && existing.resolved === source) continue; // already correct, nothing to do
    if (existing.exists && !existing.isSymlink) {
      throw new Error(
        `Refusing to install "${name}" for harness "${harnessName}": ${targetPath} already exists as a real directory, not a symlink. No changes made.`
      );
    }

    plan.push({ targetPath, source, replace: existing.isSymlink });
  }

  for (const { targetPath, source, replace } of plan) {
    if (replace) await unlink(targetPath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await symlink(source, targetPath, "dir");
  }
}

/**
 * Removes a harness's symlink-based categories previously created by
 * `install`. Real (non-symlink) directories are left untouched, and a
 * missing path is treated as already-uninstalled.
 *
 * @param {string} harnessName - Key of the harness in `config.harnesses`.
 * @param {{config: import("./types.js").CapabilitiesConfig, capabilitiesRoot: string}} options - Parsed capabilities.yaml and repo root.
 * @returns {Promise<void>}
 */
export async function uninstall(harnessName, { config, capabilitiesRoot }) {
  const harness = requireHarness(config, harnessName);
  const categories = symlinkCategories(capabilitiesRoot);

  for (const [name] of Object.entries(categories)) {
    const targetPath = harness[name];
    if (!targetPath) continue;

    const existing = await existingLinkTarget(targetPath);
    if (existing.isSymlink) await unlink(targetPath);
  }
}

/**
 * Looks up a harness's config, raising a clear error if it isn't defined.
 *
 * @param {import("./types.js").CapabilitiesConfig} config - Parsed capabilities.yaml.
 * @param {string} harnessName - Key of the harness in `config.harnesses`.
 * @returns {Record<string, string>} The harness's category map.
 */
function requireHarness(config, harnessName) {
  const harness = config.harnesses[harnessName];
  if (!harness) throw new Error(`Unknown harness: "${harnessName}"`);
  return harness;
}

/**
 * Inspects what, if anything, already sits at a symlink target path.
 *
 * @param {string} targetPath - Path a symlink category would be installed at.
 * @returns {Promise<{exists: boolean, isSymlink?: boolean, resolved?: string}>} Existing state.
 */
async function existingLinkTarget(targetPath) {
  let stats;
  try {
    stats = await lstat(targetPath);
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code === "ENOENT") return { exists: false };
    throw err;
  }

  if (!stats.isSymbolicLink()) return { exists: true, isSymlink: false };

  const link = await readlink(targetPath);
  return { exists: true, isSymlink: true, resolved: path.resolve(path.dirname(targetPath), link) };
}

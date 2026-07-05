// cli.test.js — end-to-end tests for bin/capabilities as an actual executable,
// including invocation via a symlink (as it will be from ~/bin in real use).

// System dependencies
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, writeFile, readFile, cp, chmod, symlink, lstat, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Builds a standalone copy of the CLI (bin + lib, symlinked node_modules)
 * plus a fake capabilities.yaml and traits/{skills,agents,rules}, isolated
 * from the real repo.
 *
 * @returns {Promise<{root: string, cliPath: string, home: string}>} Fixture paths.
 */
async function makeFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "capabilities-cli-"));
  await cp(path.join(repoRoot, "lib"), path.join(root, "lib"), { recursive: true });
  await mkdir(path.join(root, "bin"), { recursive: true });
  await cp(path.join(repoRoot, "bin", "capabilities"), path.join(root, "bin", "capabilities"));
  await chmod(path.join(root, "bin", "capabilities"), 0o755);
  await symlink(path.join(repoRoot, "node_modules"), path.join(root, "node_modules"), "dir");

  await mkdir(path.join(root, "traits", "skills"), { recursive: true });
  await mkdir(path.join(root, "traits", "agents"), { recursive: true });
  await mkdir(path.join(root, "traits", "rules"), { recursive: true });

  const home = path.join(root, "home");
  await writeFile(
    path.join(root, "capabilities.yaml"),
    [
      "harnesses:",
      "  testharness:",
      `    skills: ${path.join(home, ".testharness", "skills")}`,
      `    agents: ${path.join(home, ".testharness", "agents")}`,
      `    rules: ${path.join(home, ".testharness", "rules")}`,
      "",
    ].join("\n")
  );

  return { root, cliPath: path.join(root, "bin", "capabilities"), home };
}

describe("bin/capabilities", () => {
  it("installs a harness end-to-end when run directly", async () => {
    const { root, cliPath, home } = await makeFixture();

    const { stdout } = await run(process.execPath, [cliPath, "install", "testharness"]);
    assert.match(stdout, /Installed testharness/);

    for (const category of ["skills", "agents", "rules"]) {
      const stats = await lstat(path.join(home, ".testharness", category));
      assert.ok(stats.isSymbolicLink(), `expected ${category} to be a symlink`);
    }

    await rm(root, { recursive: true, force: true });
  });

  it("works when invoked via a symlink, as it will be from ~/bin", async () => {
    const { root, cliPath, home } = await makeFixture();
    const symlinkedCli = path.join(root, "capabilities-symlink");
    await symlink(cliPath, symlinkedCli);

    const { stdout } = await run(process.execPath, [symlinkedCli, "install", "testharness"]);
    assert.match(stdout, /Installed testharness/);

    const linkPath = path.join(home, ".testharness", "skills");
    const stats = await lstat(linkPath);
    assert.ok(stats.isSymbolicLink());

    await rm(root, { recursive: true, force: true });
  });

  it("uninstalls a harness end-to-end", async () => {
    const { root, cliPath, home } = await makeFixture();

    await run(process.execPath, [cliPath, "install", "testharness"]);
    const { stdout } = await run(process.execPath, [cliPath, "uninstall", "testharness"]);
    assert.match(stdout, /Uninstalled testharness/);

    for (const category of ["skills", "agents", "rules"]) {
      await assert.rejects(lstat(path.join(home, ".testharness", category)), /ENOENT/);
    }

    await rm(root, { recursive: true, force: true });
  });

  it("exits non-zero with a usage message when given no arguments", async () => {
    const { root, cliPath } = await makeFixture();

    await assert.rejects(run(process.execPath, [cliPath]), /Usage: capabilities/);

    await rm(root, { recursive: true, force: true });
  });

  it("reports status for every harness", async () => {
    const { root, cliPath } = await makeFixture();

    const { stdout } = await run(process.execPath, [cliPath, "status"]);
    assert.match(stdout, /testharness/);
    assert.match(stdout, /skills: missing/);
    assert.match(stdout, /agents: missing/);
    assert.match(stdout, /rules: missing/);

    await rm(root, { recursive: true, force: true });
  });

  it("scaffolds a new skill", async () => {
    const { root, cliPath } = await makeFixture();

    const { stdout } = await run(process.execPath, [cliPath, "new", "skill", "my-skill"]);
    assert.match(stdout, /Created traits\/skills\/my-skill\/SKILL\.md/);

    const content = await readFile(path.join(root, "traits", "skills", "my-skill", "SKILL.md"), "utf8");
    assert.match(content, /name: my-skill/);

    await rm(root, { recursive: true, force: true });
  });
});

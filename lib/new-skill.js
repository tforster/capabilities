// new-skill.js — scaffolds a new traits/skills/<name>/SKILL.md from a template

// System dependencies
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

/**
 * Scaffolds a new skill folder with a SKILL.md template, frontmatter filled
 * in from the given name. Refuses if a skill with that name already exists.
 *
 * @param {string} name - Skill name (used as both the folder and frontmatter `name`).
 * @param {{capabilitiesRoot: string}} options - Repo root to scaffold into.
 * @returns {Promise<void>}
 */
export async function newSkill(name, { capabilitiesRoot }) {
  const skillDir = path.join(capabilitiesRoot, "traits", "skills", name);

  if (await exists(skillDir)) {
    throw new Error(`Refusing to create skill "${name}": ${skillDir} already exists.`);
  }

  await mkdir(skillDir, { recursive: true });
  await writeFile(
    path.join(skillDir, "SKILL.md"),
    `---\nname: ${name}\ndescription: TODO — describe when to use this skill.\n---\n\n# ${name}\n`
  );
}

/**
 * Checks whether a path exists, regardless of type.
 *
 * @param {string} targetPath - Path to check.
 * @returns {Promise<boolean>} Whether the path exists.
 */
async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code === "ENOENT") return false;
    throw err;
  }
}

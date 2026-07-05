// new-skill.test.js — behavioural tests for capabilities new skill <name>

// System dependencies
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Local dependencies
import { newSkill } from "../lib/new-skill.js";

/**
 * Builds an isolated fixture: a fake capabilities repo root with a skills/ folder.
 *
 * @returns {Promise<{root: string, capabilitiesRoot: string}>} Fixture paths.
 */
async function makeFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "capabilities-new-skill-"));
  const capabilitiesRoot = path.join(root, "repo");
  await mkdir(path.join(capabilitiesRoot, "traits", "skills"), { recursive: true });
  return { root, capabilitiesRoot };
}

describe("newSkill", () => {
  it("creates traits/skills/<name>/SKILL.md with valid frontmatter", async () => {
    const { root, capabilitiesRoot } = await makeFixture();

    await newSkill("my-new-skill", { capabilitiesRoot });

    const content = await readFile(path.join(capabilitiesRoot, "traits", "skills", "my-new-skill", "SKILL.md"), "utf8");
    assert.match(content, /^---\nname: my-new-skill\ndescription: .+\n---\n/);

    await rm(root, { recursive: true, force: true });
  });

  it("refuses if a skill with that name already exists", async () => {
    const { root, capabilitiesRoot } = await makeFixture();
    await newSkill("existing-skill", { capabilitiesRoot });

    await assert.rejects(newSkill("existing-skill", { capabilitiesRoot }), /already exists/i);

    await rm(root, { recursive: true, force: true });
  });
});

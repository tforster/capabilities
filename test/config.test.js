// config.test.js — behavioural tests for capabilities.yaml loading and ~ expansion

// System dependencies
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import path from "node:path";

// Local dependencies
import { loadConfig } from "../lib/config.js";

describe("loadConfig", () => {
  it("parses harnesses and expands ~ to the home directory", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "capabilities-config-"));
    const yamlPath = path.join(root, "capabilities.yaml");
    await writeFile(yamlPath, "harnesses:\n  claude:\n    skills: ~/.claude/skills\n    agents: ~/.claude/agents\n");

    const config = await loadConfig(yamlPath);

    assert.strictEqual(config.harnesses.claude.skills, path.join(homedir(), ".claude", "skills"));
    assert.strictEqual(config.harnesses.claude.agents, path.join(homedir(), ".claude", "agents"));

    await rm(root, { recursive: true, force: true });
  });
});

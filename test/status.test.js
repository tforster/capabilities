// status.test.js — behavioural tests for capabilities status

// System dependencies
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { mkdtemp, mkdir, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Local dependencies
import { install } from "../lib/install.js";
import { status } from "../lib/status.js";

/**
 * Builds an isolated fixture: a fake capabilities repo root (with populated
 * traits/{skills,agents,rules} content) and a fake home directory to inspect.
 *
 * @returns {Promise<{root: string, capabilitiesRoot: string, home: string}>} Fixture paths.
 */
async function makeFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "capabilities-status-"));
  const capabilitiesRoot = path.join(root, "repo");
  const home = path.join(root, "home");
  await mkdir(path.join(capabilitiesRoot, "traits", "skills"), { recursive: true });
  await mkdir(path.join(capabilitiesRoot, "traits", "agents"), { recursive: true });
  await mkdir(path.join(capabilitiesRoot, "traits", "rules"), { recursive: true });
  return { root, capabilitiesRoot, home };
}

describe("status", () => {
  it("reports 'correct' for a properly installed symlink category", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const config = {
      harnesses: {
        testharness: { skills: path.join(home, ".testharness", "skills") },
      },
    };

    await install("testharness", { config, capabilitiesRoot });
    const report = await status({ config, capabilitiesRoot });

    assert.strictEqual(report.testharness.skills, "correct");

    await rm(root, { recursive: true, force: true });
  });

  it("reports 'not-applicable' for a category the harness doesn't configure", async () => {
    const { root, capabilitiesRoot } = await makeFixture();
    const config = { harnesses: { testharness: {} } };

    const report = await status({ config, capabilitiesRoot });

    assert.strictEqual(report.testharness.skills, "not-applicable");

    await rm(root, { recursive: true, force: true });
  });

  it("reports 'missing' when the configured path doesn't exist yet", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const config = {
      harnesses: { testharness: { skills: path.join(home, ".testharness", "skills") } },
    };

    const report = await status({ config, capabilitiesRoot });

    assert.strictEqual(report.testharness.skills, "missing");

    await rm(root, { recursive: true, force: true });
  });

  it("reports 'broken' when a real directory sits where a symlink is expected", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const skillsTarget = path.join(home, ".testharness", "skills");
    await mkdir(skillsTarget, { recursive: true });
    const config = { harnesses: { testharness: { skills: skillsTarget } } };

    const report = await status({ config, capabilitiesRoot });

    assert.strictEqual(report.testharness.skills, "broken");

    await rm(root, { recursive: true, force: true });
  });

  it("reports 'broken' for a dangling symlink", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const skillsTarget = path.join(home, ".testharness", "skills");
    await mkdir(path.dirname(skillsTarget), { recursive: true });
    await symlink(path.join(capabilitiesRoot, "nonexistent-skills"), skillsTarget, "dir");
    const config = { harnesses: { testharness: { skills: skillsTarget } } };

    const report = await status({ config, capabilitiesRoot });

    assert.strictEqual(report.testharness.skills, "broken");

    await rm(root, { recursive: true, force: true });
  });

  it("reports state for every harness in config, not just one", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const config = {
      harnesses: {
        alpha: { skills: path.join(home, ".alpha", "skills") },
        beta: {},
      },
    };

    const report = await status({ config, capabilitiesRoot });

    assert.strictEqual(report.alpha.skills, "missing");
    assert.strictEqual(report.beta.skills, "not-applicable");

    await rm(root, { recursive: true, force: true });
  });

  it("reports agents using the same symlink-status logic as skills/rules", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const config = {
      harnesses: { testharness: { agents: path.join(home, ".testharness", "agents") } },
    };

    await install("testharness", { config, capabilitiesRoot });
    const report = await status({ config, capabilitiesRoot });

    assert.strictEqual(report.testharness.agents, "correct");

    await rm(root, { recursive: true, force: true });
  });
});

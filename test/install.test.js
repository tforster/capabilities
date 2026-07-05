// install.test.js — behavioural tests for capabilities install/uninstall (symlink categories)
//
// Uses real temp directories rather than mocking fs: the behaviour under test
// is filesystem symlink manipulation, so a fake fs would test our own stub
// instead of real behaviour.
//
// All three trait categories (skills, agents, rules) use the same plain
// directory-symlink model — see prd.md §4.1.

// System dependencies
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { mkdtemp, mkdir, rm, lstat, readlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Local dependencies
import { install, uninstall } from "../lib/install.js";

/**
 * Builds an isolated fixture: a fake capabilities repo root (with populated
 * traits/{skills,agents,rules} content) and a fake home directory to install into.
 *
 * @returns {Promise<{root: string, capabilitiesRoot: string, home: string}>} Fixture paths.
 */
async function makeFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "capabilities-"));
  const capabilitiesRoot = path.join(root, "repo");
  const home = path.join(root, "home");
  await mkdir(path.join(capabilitiesRoot, "traits", "skills"), { recursive: true });
  await mkdir(path.join(capabilitiesRoot, "traits", "agents"), { recursive: true });
  await mkdir(path.join(capabilitiesRoot, "traits", "rules"), { recursive: true });
  return { root, capabilitiesRoot, home };
}

describe("install", () => {
  it("raises a clear error for an unknown harness", async () => {
    const { root, capabilitiesRoot } = await makeFixture();
    const config = { harnesses: {} };

    await assert.rejects(install("nonexistent", { config, capabilitiesRoot }), /unknown harness/i);

    await rm(root, { recursive: true, force: true });
  });

  it("symlinks the skills directory to the harness's configured path", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const config = {
      harnesses: {
        testharness: {
          skills: path.join(home, ".testharness", "skills"),
        },
      },
    };

    await install("testharness", { config, capabilitiesRoot });

    const linkPath = path.join(home, ".testharness", "skills");
    const stats = await lstat(linkPath);
    assert.ok(stats.isSymbolicLink(), "expected a symlink");
    const target = await readlink(linkPath);
    assert.strictEqual(path.resolve(path.dirname(linkPath), target), path.join(capabilitiesRoot, "traits", "skills"));

    await rm(root, { recursive: true, force: true });
  });

  it("symlinks the agents directory to the harness's configured path", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const config = {
      harnesses: {
        testharness: {
          agents: path.join(home, ".testharness", "agents"),
        },
      },
    };

    await install("testharness", { config, capabilitiesRoot });

    const linkPath = path.join(home, ".testharness", "agents");
    const stats = await lstat(linkPath);
    assert.ok(stats.isSymbolicLink(), "expected a symlink");
    assert.strictEqual(
      path.resolve(path.dirname(linkPath), await readlink(linkPath)),
      path.join(capabilitiesRoot, "traits", "agents")
    );

    await rm(root, { recursive: true, force: true });
  });

  it("symlinks the rules directory to the harness's configured path", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const config = {
      harnesses: {
        testharness: {
          rules: path.join(home, ".testharness", "rules"),
        },
      },
    };

    await install("testharness", { config, capabilitiesRoot });

    const linkPath = path.join(home, ".testharness", "rules");
    const stats = await lstat(linkPath);
    assert.ok(stats.isSymbolicLink(), "expected a symlink");
    assert.strictEqual(
      path.resolve(path.dirname(linkPath), await readlink(linkPath)),
      path.join(capabilitiesRoot, "traits", "rules")
    );

    await rm(root, { recursive: true, force: true });
  });

  it("skips categories that aren't configured for the harness", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const config = {
      harnesses: {
        testharness: {
          skills: path.join(home, ".testharness", "skills"),
        },
      },
    };

    await install("testharness", { config, capabilitiesRoot });

    await assert.rejects(lstat(path.join(home, ".testharness", "agents")));
    await assert.rejects(lstat(path.join(home, ".testharness", "rules")));

    await rm(root, { recursive: true, force: true });
  });

  it("is a no-op when re-run on an already-installed harness", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const config = {
      harnesses: {
        testharness: {
          skills: path.join(home, ".testharness", "skills"),
        },
      },
    };

    await install("testharness", { config, capabilitiesRoot });
    await install("testharness", { config, capabilitiesRoot });

    const linkPath = path.join(home, ".testharness", "skills");
    const stats = await lstat(linkPath);
    assert.ok(stats.isSymbolicLink(), "expected a symlink");
    assert.strictEqual(
      path.resolve(path.dirname(linkPath), await readlink(linkPath)),
      path.join(capabilitiesRoot, "traits", "skills")
    );

    await rm(root, { recursive: true, force: true });
  });

  it("refuses and makes no changes when a target path is a real directory", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const skillsTarget = path.join(home, ".testharness", "skills");
    const agentsTarget = path.join(home, ".testharness", "agents");
    await mkdir(skillsTarget, { recursive: true }); // pre-existing real directory, not a symlink

    const config = {
      harnesses: {
        testharness: {
          skills: skillsTarget,
          agents: agentsTarget,
        },
      },
    };

    await assert.rejects(install("testharness", { config, capabilitiesRoot }), /real directory/i);

    // The conflicting path is untouched, and the other category was never installed.
    const stats = await lstat(skillsTarget);
    assert.ok(!stats.isSymbolicLink(), "pre-existing real directory must be left alone");
    await assert.rejects(lstat(agentsTarget), /ENOENT/);

    await rm(root, { recursive: true, force: true });
  });
});

describe("uninstall", () => {
  it("removes symlinks previously created by install", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const config = {
      harnesses: {
        testharness: {
          skills: path.join(home, ".testharness", "skills"),
          agents: path.join(home, ".testharness", "agents"),
          rules: path.join(home, ".testharness", "rules"),
        },
      },
    };

    await install("testharness", { config, capabilitiesRoot });
    await uninstall("testharness", { config, capabilitiesRoot });

    await assert.rejects(lstat(path.join(home, ".testharness", "skills")), /ENOENT/);
    await assert.rejects(lstat(path.join(home, ".testharness", "agents")), /ENOENT/);
    await assert.rejects(lstat(path.join(home, ".testharness", "rules")), /ENOENT/);

    await rm(root, { recursive: true, force: true });
  });

  it("leaves a real directory alone rather than deleting it", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const skillsTarget = path.join(home, ".testharness", "skills");
    await mkdir(skillsTarget, { recursive: true });

    const config = {
      harnesses: {
        testharness: { skills: skillsTarget },
      },
    };

    await uninstall("testharness", { config, capabilitiesRoot });

    const stats = await lstat(skillsTarget);
    assert.ok(stats.isDirectory() && !stats.isSymbolicLink(), "real directory must survive uninstall");

    await rm(root, { recursive: true, force: true });
  });

  it("raises a clear error for an unknown harness", async () => {
    const { root, capabilitiesRoot } = await makeFixture();
    const config = { harnesses: {} };

    await assert.rejects(uninstall("nonexistent", { config, capabilitiesRoot }), /unknown harness/i);

    await rm(root, { recursive: true, force: true });
  });

  it("is a no-op when nothing is installed", async () => {
    const { root, capabilitiesRoot, home } = await makeFixture();
    const config = {
      harnesses: {
        testharness: { skills: path.join(home, ".testharness", "skills") },
      },
    };

    await uninstall("testharness", { config, capabilitiesRoot });

    await rm(root, { recursive: true, force: true });
  });
});

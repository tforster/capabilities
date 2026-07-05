// config.js — loads and normalizes capabilities.yaml

// System dependencies
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

// Third party dependencies
import { parse } from "yaml";

/**
 * Loads capabilities.yaml, expanding leading `~` in every harness category
 * path to the current user's home directory.
 *
 * @param {string} yamlPath - Absolute path to capabilities.yaml.
 * @returns {Promise<import("./types.js").CapabilitiesConfig>} Normalized config.
 */
export async function loadConfig(yamlPath) {
  const raw = parse(await readFile(yamlPath, "utf8"));
  /** @type {Record<string, Record<string, string>>} */
  const harnesses = {};

  for (const [harnessName, categories] of Object.entries(raw.harnesses ?? {})) {
    harnesses[harnessName] = {};
    for (const [category, value] of Object.entries(categories)) {
      harnesses[harnessName][category] = expandHome(value);
    }
  }

  return { harnesses };
}

/**
 * Expands a leading `~` (or `~/`) to the current user's home directory.
 *
 * @param {string} inputPath - Path possibly starting with `~`.
 * @returns {string} Path with `~` expanded.
 */
function expandHome(inputPath) {
  if (inputPath === "~") return homedir();
  if (inputPath.startsWith("~/")) return path.join(homedir(), inputPath.slice(2));
  return inputPath;
}

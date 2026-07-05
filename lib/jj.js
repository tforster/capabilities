// jj.js — thin wrapper around the `jj` CLI; the system boundary sync.js is mocked against in tests

// System dependencies
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Runs a jj subcommand and returns its output.
 *
 * @param {string[]} args - Arguments to `jj` (e.g. ["git", "fetch"]).
 * @param {{cwd?: string}} [options] - Working directory to run in.
 * @returns {Promise<{stdout: string, stderr: string}>} Combined command output.
 */
export async function runJj(args, options = {}) {
  return execFileAsync("jj", args, options);
}

# Harness Skill

Enforces "Low-Fat" ESM JavaScript standards and surgical code changes.

## Usage

- Automatically triggered when the user asks to "verify work" or "run the harness".
- **Must** be executed before any code is considered "Final".

## Instructions

1. Run the `verify.js` tool using Node.js.
2. If the tool returns a non-zero exit code:
   - Read the error output carefully.
   - Self-correct the code (remove bloat, fix ESM, or undo non-surgical changes).
   - Re-run the harness until it passes.
3. Only once `verify.js` succeeds may you signal the task is complete.

## Tools

- `node ./verify.js`: The primary verification engine.

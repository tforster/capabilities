# capabilities — Issues

Tracking file until a real issue tracker is adopted. All issues start with a `needs-triage` status.

**Note on version control**: this repo uses [Jujitsu](https://jj-vcs.github.io/jj/) (`jj`) on a colocated git backend. Steps below are described in `jj` terms (changes, `describe`, `squash`, bookmarks) rather than git terms (commits, branches), even though the underlying storage is git.

**Note on divergence from PRD §10**: PRD originally specified a hand-rolled YAML parser for the zero-dependency philosophy. Decision since: use the [`yaml`](https://www.npmjs.com/package/yaml) npm package (zero dependencies of its own, already used in other projects, more reliable if the schema grows). PRD not yet updated to reflect this — issue 1/7 below are the source of truth until it is.

**Note on testing**: all tests use Node's built-in test runner (`node:test`/`node:assert`, available since Node 18) — no external test framework. Applies to every issue that produces CLI code (7, 8, 9, 10, 11).

**Note on redesign drift (issues 14–16)**: `prd.md` was substantially revised after issues 1–11 shipped — multi-harness support (Copilot/pi) was dropped in favour of Claude-only, agents moved from a generated per-harness model to a plain symlink (same as skills), the `instructions` category was renamed `rules` and flattened (no more global-file/`scoped/` split), and `skills/`, `agents/`, `rules/` were physically moved under a new `traits/` parent folder. See `prd.md` §2–§4 for the full rationale. Issues 1–11 remain accurate as a historical build log — their premises (namespaced frontmatter, `instructions/`, root-level category folders) were correct when built, just since superseded. Issues 14–16 below track bringing the code back in line with the current `prd.md`.

| #   | Title                                                                                | Type                              | Blocked by |
| --- | ------------------------------------------------------------------------------------ | --------------------------------- | ---------- |
| 1   | Scaffold repo structure, `capabilities.yaml`, `package.json`                         | AFK                               | —          |
| 2   | Migrate skill content into `capabilities/skills/`                                    | AFK                               | 1          |
| 3   | Convert Copilot agents into namespaced-frontmatter format                            | AFK                               | 1          |
| 4   | Migrate instructions content into `capabilities/instructions/`                       | AFK                               | 1          |
| 5   | Sanitize the 5 flagged files                                                         | HITL                              | 2, 3       |
| 6   | Squash local jj history into a single change                                         | AFK                               | 4, 5       |
| 7   | Build `capabilities install`/`uninstall` — symlink categories (skills, instructions) | AFK                               | 1          |
| 8   | Build `capabilities install`/`uninstall` — agents (generate)                         | AFK (provisional split, see note) | 7, 3       |
| 9   | Build `capabilities status`                                                          | AFK                               | 7, 8       |
| 10  | Build `capabilities sync` (jj-based)                                                 | AFK                               | 7, 6       |
| 11  | Build `capabilities new skill <name>` scaffolder                                     | AFK                               | 7          |
| 12  | Confirm git host, create bookmark, push first change                                 | HITL                              | 6          |
| 13  | Choose and add a LICENSE                                                             | HITL                              | —          |
| 14  | Rewrite `capabilities.yaml` to the single-harness schema                             | AFK                               | —          |
| 15  | Fold agents into the plain-symlink install model; fix `traits/` source paths         | AFK                               | —          |
| 16  | Flatten the 5 agents' `copilot:` blocks to plain Claude-native frontmatter           | AFK                               | —          |

---

## 1. Scaffold repo structure, `capabilities.yaml`, `package.json`

**Type**: AFK
**Blocked by**: None — can start immediately

### What to build

Create the base repo layout: `skills/`, `agents/`, `instructions/scoped/`, `bin/`. Add `capabilities.yaml` per PRD §11 (harness registry nested under a top-level `harnesses` key). Add `package.json` — `"type": "module"` (ESM, no CommonJS, per existing engineering philosophy), `yaml` as a dependency.

### Acceptance criteria

- [x] `skills/`, `agents/`, `instructions/`, `instructions/scoped/`, `bin/` directories exist
- [x] `capabilities.yaml` exists with entries for `claude`, `copilot`, `pi` per PRD §11
- [x] `package.json` exists, `"type": "module"`, `yaml` listed as a dependency
- [x] `package.json` has a `test` script running Node's built-in test runner (e.g. `node --test`)
- [x] `README.md` stub exists

### Blocked by

None — can start immediately

---

## 2. Migrate skill content into `capabilities/skills/`

**Type**: AFK
**Blocked by**: 1

### What to build

Copy the union of `~/.claude/skills` and `~/.copilot/skills` into `capabilities/skills/`. Content already verified as non-conflicting (overlapping skills are byte-identical); this is a mechanical merge, not a reconciliation.

### Acceptance criteria

- [x] All skill folders from both sources present in `capabilities/skills/`
- [x] No content loss versus either source
- [x] Original source folders left untouched (they get replaced by symlinks later, in issue 7's rollout — not here)

### Blocked by

1

---

## 3. Convert Copilot agents into namespaced-frontmatter format

**Type**: AFK
**Blocked by**: 1

### What to build

Take the 5 files in `~/.copilot/agents/*.md` and restructure each into the namespaced-frontmatter shape from PRD §6: top-level `name`/`description`, existing tool list and hooks nested under a `copilot:` key, shared instructions body left as-is. No content judgment required — this is a mechanical restructuring of existing frontmatter.

### Acceptance criteria

- [x] All 5 agents present in `capabilities/agents/` in the new namespaced format
- [x] Each retains its original `copilot:` block content unchanged (tools, hooks)
- [x] No `claude:`/`pi:` blocks fabricated — those stay absent until an agent is actually ported

### Blocked by

1

---

## 4. Migrate instructions content into `capabilities/instructions/`

**Type**: AFK
**Blocked by**: 1

### What to build

Copy `~/.copilot/instructions.md` to `capabilities/instructions/instructions.md`, and `~/.copilot/instructions/*.instructions.md` to `capabilities/instructions/scoped/`.

### Acceptance criteria

- [x] `capabilities/instructions/instructions.md` present
- [x] All 5 files from `~/.copilot/instructions/` present under `capabilities/instructions/scoped/`

### Blocked by

1

---

## 5. Sanitize the 5 flagged files

**Type**: HITL
**Blocked by**: 2, 3

### What to build

Genericize client-identifying content in the migrated copies (not the originals) per PRD §8:

- `agents/doc-agent.md` — rewrite body to remove "*** organisation" framing
- `agents/iac-agent.md` — rewrite body to remove "*** portfolio" framing
- `skills/dynamodb/SKILL.md` — fix/remove `author: ***`
- `skills/jira/SKILL.md` — replace hardcoded `***-aws.atlassian.net` with a placeholder/env-var pattern
- `skills/jira/references/custom-fields.md` — same fix

### Acceptance criteria

- [x] No occurrence of "_**", "**_", or `***-aws.atlassian.net` anywhere under `capabilities/` (re-run the discovery greps from the PRD conversation to confirm)
- [x] Rewritten agent bodies still read as coherent, generically useful agents
- [x] `jira` skill still functions when a real instance URL is substituted in

### Blocked by

2, 3

---

## 6. Squash local jj history into a single change

**Type**: AFK
**Blocked by**: 4, 5

### What to build

Work through issues 1–5 as one or more jj changes (`jj new`/`jj describe` as needed). Once sanitization (5) is complete, squash everything into a single clean change (`jj squash` repeatedly, or squash a revset spanning all working changes) so no intermediate, unsanitized state exists anywhere in history before it's ever pushed publicly.

### Acceptance criteria

- [x] All work from issues 1–5 collapsed into a single jj change
- [x] That change's full contents contain no client-identifying strings (same check as issue 5)
- [x] `jj log` shows a single change ready to push (bookmark creation happens in issue 12)

### Blocked by

4, 5

---

## 7. Build `capabilities install`/`uninstall` — symlink categories (skills, instructions)

**Type**: AFK
**Blocked by**: 1

### What to build

Node.js CLI entry point at `bin/capabilities` (ESM, WinterCG-compliant APIs wherever one exists — `node:fs`/`node:child_process` where it doesn't). Parse `capabilities.yaml` using the `yaml` package. Implement `install <harness>` and `uninstall <harness>` for symlink-based categories (skills, instructions): create/remove the directory symlink at the harness's configured path. Idempotent. If the target already exists as a real (non-symlink) directory, refuse and warn rather than overwrite — first-machine migration is issues 1–6, not this command's job.

### Acceptance criteria

- [x] `capabilities install <harness>` symlinks `skills/` and `instructions/` (where configured) to the right target paths
- [x] `capabilities uninstall <harness>` removes those symlinks
- [x] Re-running `install` on an already-installed harness is a no-op, not an error
- [x] Running `install` against a harness whose target path is a real directory refuses with a clear message, makes no changes
- [x] `bin/capabilities` is executable and works when invoked via a symlink from `~/bin`
- [x] `node:test` coverage for install/uninstall logic, including the refuse-on-real-directory and re-run-is-a-no-op cases

### Blocked by

1

---

## 8. Build `capabilities install`/`uninstall` — agents (generate)

**Type**: AFK — _provisional split from issue 7, re-evaluate before starting_
**Blocked by**: 7, 3

### What to build

Extend `install`/`uninstall` to handle the `agents` category differently from symlink categories: parse each file in `agents/`, select the frontmatter block matching the target harness, strip the others, write a harness-native file into the harness's configured agents path. This output is derived — never written into the `capabilities` repo itself. `uninstall` removes the generated files it created.

### Acceptance criteria

- [x] `capabilities install <harness>` generates one harness-native agent file per source agent that has a block for that harness
- [x] Agents with no block for the target harness are skipped, not errored
- [x] Generated files match what's described in PRD §6 (harness's own native frontmatter, shared body)
- [x] `capabilities uninstall <harness>` removes previously-generated agent files
- [x] Re-running `install` regenerates cleanly (no duplication, no stale leftovers)
- [x] `node:test` coverage for frontmatter parsing/namespace-selection/stripping, including an agent with no block for the target harness

### Blocked by

7, 3

---

## 9. Build `capabilities status`

**Type**: AFK
**Blocked by**: 7, 8

### What to build

Report, per known harness and category, whether the expected symlink/generated files are present, correct, missing, or broken (e.g., dangling symlink, or a real directory where a symlink should be).

### Acceptance criteria

- [x] Running with no arguments reports state for every harness in `capabilities.yaml`
- [x] Distinguishes "not applicable" (harness has no path configured for a category) from "missing" (path configured but absent)
- [x] Flags a real directory sitting where a symlink is expected, distinctly from a correctly-installed symlink
- [x] `node:test` coverage for each state (correct, missing, broken, not-applicable)

### Blocked by

7, 8

---

## 10. Build `capabilities sync` (jj-based)

**Type**: AFK
**Blocked by**: 7, 6

### What to build

One command wrapping the jj equivalent of fetch → integrate → describe → push: `jj git fetch`, rebase/integrate any incoming changes, `jj describe -m <message>` for local changes, `jj git push`. Shells out via `node:child_process` (no WinterCG equivalent for this).

### Acceptance criteria

- [x] `capabilities sync` fetches from the remote, integrates remote changes, describes any local working-copy changes, and pushes — in one invocation
- [x] A conflict during integration surfaces clearly rather than failing silently
- [x] Running `sync` with no local changes and nothing new remotely is a clean no-op
- [x] `node:test` coverage for the command-sequencing logic (mocking the `child_process` calls to `jj`)

### Blocked by

7, 6

---

## 11. Build `capabilities new skill <name>` scaffolder

**Type**: AFK
**Blocked by**: 7

### What to build

Scaffold a new skill folder with a `SKILL.md` template (frontmatter with `name`/`description` placeholders filled from the argument).

### Acceptance criteria

- [x] `capabilities new skill <name>` creates `skills/<name>/SKILL.md` with valid frontmatter
- [x] Refuses if a skill with that name already exists
- [x] `node:test` coverage for both cases

### Blocked by

7

---

## 12. Confirm git host, create bookmark, push first change

**Type**: HITL
**Blocked by**: 6

### What to build

Confirm GitHub as host (per PRD §13), create the remote repository, decide public-from-the-start vs private-until-ready. Create a `main` bookmark pointing at the squashed change from issue 6, then `jj git push` it.

### Acceptance criteria

- [ ] Remote repository exists on the confirmed host
- [ ] `main` bookmark created and pointing at the squashed change
- [ ] `jj git push` completes successfully
- [ ] Repository visibility matches the decision made at this step

### Blocked by

6

---

## 13. Choose and add a LICENSE

**Type**: HITL
**Blocked by**: None — can start immediately

### What to build

Pick a license and add a `LICENSE` file at repo root.

### Acceptance criteria

- [ ] `LICENSE` file present at repo root
- [ ] License choice reflects intended public use

### Blocked by

None — should land before issue 12 if going public immediately

---

## 14. Rewrite `capabilities.yaml` to the single-harness schema

**Type**: AFK
**Blocked by**: None — can start immediately

### What to build

Replace the current multi-harness `capabilities.yaml` (which still has `copilot:`/`pi:` entries and `claude:` using the old `instructions`/`instructions_scoped` keys) with the single-harness schema from `prd.md` §3.2: only `claude:`, with `skills`, `agents`, `rules` keys pointing at `~/.claude/skills`, `~/.claude/agents`, `~/.claude/rules`.

### Acceptance criteria

- [x] `capabilities.yaml` has exactly one harness, `claude:`
- [x] `claude:` has `skills`, `agents`, `rules` keys (no `instructions`/`instructions_scoped`)
- [x] No `copilot:`/`pi:` entries remain

### Blocked by

None — can start immediately

---

## 15. Fold agents into the plain-symlink install model; fix `traits/` source paths

**Type**: AFK
**Blocked by**: None — can start immediately

### What to build

Two changes that land together because they touch the same code: `lib/install.js`'s `symlinkCategories()` currently resolves source paths that no longer exist (`<root>/skills`, `<root>/instructions/instructions.md`, `<root>/instructions/scoped`) — fix these to `<root>/traits/skills`, and replace the two-key `instructions`/`instructions_scoped` split with a single flat `rules` key pointing at `<root>/traits/rules` (directory symlink, matching `prd.md` §4.3). Then fold `agents` in as a third plain-directory-symlink category (`<root>/traits/agents`, matching §4.1) — delete `lib/agents.js` entirely (the generated/namespaced-frontmatter model it implements is superseded, §4.2), remove its `installAgents`/`uninstallAgents` calls from `bin/capabilities`, and fix `lib/new-skill.js`'s hardcoded `skills` path to `traits/skills`.

`lib/status.js`'s special-cased `agentsStatus` (checking for "real directory, not symlink") goes away too — once agents are an ordinary symlink category, `status` treats it exactly like skills and rules.

### Acceptance criteria

- [x] `capabilities install claude` correctly symlinks `traits/skills`, `traits/agents`, and `traits/rules` — all via the same code path in `lib/install.js`
- [x] `lib/agents.js` and `test/agents.test.js` deleted
- [x] `lib/new-skill.js` scaffolds into `traits/skills/<name>/SKILL.md`
- [x] `bin/capabilities` no longer imports or calls anything from `lib/agents.js`
- [x] `lib/status.js` reports `agents` using the same symlink-status logic as `skills`/`rules` — no special-casing
- [x] `test/install.test.js`, `test/status.test.js`, `test/cli.test.js` updated to test the new `traits/`-rooted, three-symlink-category model (drop `instructions`/`instructions_scoped` fixtures, add `agents` as an ordinary symlink category)
- [x] `node:test` coverage passes end to end (`npm test`)

### Blocked by

None — can start immediately

---

## 16. Flatten the 5 agents' `copilot:` blocks to plain Claude-native frontmatter

**Type**: AFK
**Blocked by**: None — can start immediately

### What to build

The 5 files in `traits/agents/` still carry a leftover `copilot:` frontmatter block (namespaced `tools:` identifiers, and a `hooks:` block for `SeniorDev.md`) from the pre-redesign generated-agent model. Since agents are now installed as a plain symlink (issue 15) rather than parsed and regenerated per harness, that block is inert — strip it. This is mechanical, not editorial: delete the `copilot:` block from each file's frontmatter, leaving `name`, `description`, and the shared body untouched. Do not fabricate a `tools:`/`model:` replacement — Claude Code agents work fine with just `name`/`description` (no `tools:` means all tools available); adding explicit tool restrictions is a separate, editorial decision the owner can make later if wanted.

### Acceptance criteria

- [x] None of `traits/agents/{SeniorDev,cqrs-api-architect,doc-agent,iac-agent,slides-agent}.md` contain a `copilot:` key in frontmatter
- [x] `name`, `description`, and body content unchanged for all 5 files
- [x] Each file's frontmatter still parses as valid YAML

### Blocked by

None — can start immediately

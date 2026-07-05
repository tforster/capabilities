# capabilities — PRD

Working document capturing the design discussion for `capabilities`. May be discarded once the tool is built and stable.

## 1. Problem

Skill/agent/instruction files have accumulated independently in `~/.claude/skills` and `~/.copilot/skills` across a history of switching coding harnesses (Copilot → pi → Claude). There's no single source of truth, no standard format, and no mechanism to keep things consistent across 2–3 machines.

## 2. Relationship to trAIt

A separate, more ambitious proposal — [trAIt](https://github.com/tforster/trait), a distributed-wiki model for AI agent files with URL-based addressing, content-hash versioning, and fork-on-edit — exists as an RFC. It targets a different problem: a multi-author, multi-harness, publicly-shared standard.

`capabilities` is not that. It is explicitly **scaffolding**: a small, boring, single-author tool whose only job is keeping skills/agents/rules in sync across Troy's own three machines, for a single harness (Claude — see §4). It exists because the multi-machine drift problem is real and immediate, while trAIt is still at the RFC stage with no reference implementation. **`capabilities` is meant to be retired once trAIt has a working implementation worth migrating to** — it is not a long-term platform investment, and design decisions here should favour "simple and good enough for one person" over generality.

## 3. Goals

- One source of truth for reusable, **workstation-global** AI configuration: skills, agents, rules.
- Synced across machines via git.
- Public repository, eventually (see §14).

`capabilities.yaml` remains config-driven per harness (§12) so that adding a harness beyond Claude later is possible as a config edit — but multi-harness support is not an active goal (see §4, §7).

## 4. Non-goals / explicitly out of scope

- **Project-specific `CLAUDE.md` / `AGENTS.md`.** These are project-scoped, not workstation-global, and must be versioned with their own project repo — not here.
- **Multi-harness distribution.** Originally a goal; now explicitly out of scope and deferred to trAIt (§2). Claude is the only harness capabilities installs for. Because of that, agents no longer need per-harness generation either (§7) — they're symlinked directly, same as skills.
- **A permanent, repeatable migration subsystem.** The initial merge is a one-off manual/scripted pass, done independently on each machine as it's onboarded.
- **Automated content-safety guardrails** (e.g., pre-push scanning for client-identifying strings). Deferred — manual review only for v1.
- **chezmoi or any other dotfile-manager integration.** Seriously considered (symlink-topology-as-code across machines was the original appeal), but the CLI's own `install`/`sync` subcommands already cover that need. Revisit only if manual per-machine setup becomes real friction.

## 5. Repository

- Location: `~/dev/TroyForster/capabilities` — a normal, standalone git repo alongside other projects, not nested inside any dotfiles manager's source state.
- Visibility: **public**, after sanitization (§9).

```text
capabilities/
├── README.md
├── LICENSE.md
├── capabilities.yaml
├── bin/
│   └── capabilities            # Node.js entry point, symlinked into ~/bin
├── traits/                     # nod to trAIt (§2) — everything that gets installed into a harness
│   ├── skills/
│   │   └── <skill-name>/
│   │       └── SKILL.md        # + any bundled resources
│   ├── agents/
│   │   └── <agent-name>.md     # Claude-native frontmatter, plain symlink like skills/ — see §7
│   └── rules/
│       └── <topic>.md          # plain symlink like skills/agents/ — see §8
└── prd.md
```

## 6. Skills

**Model: single source of truth, plain directory symlink.**

`capabilities install <harness>` symlinks the entire `traits/skills/` directory to whatever path `capabilities.yaml` declares for that harness.

Rationale: spot-checked the skills that exist in both `~/.claude/skills` and `~/.copilot/skills` (`wrangler`, `cloudflare`) and found them byte-identical. Skill frontmatter (`name`/`description` only) carries no harness-specific vocabulary, so no per-harness variation is needed. Migration brought in the union of both sources — 23 Copilot skills + 11 Claude skills, all overlapping ones identical, plus 12 Copilot-only skills not yet copied to Claude.

## 7. Agents

**Model: single source of truth, plain directory symlink — same as skills (§6).**

`capabilities install claude` symlinks the entire `traits/agents/` directory to `~/.claude/agents`.

This supersedes the original namespaced-frontmatter, per-harness-generated design. That design existed specifically to solve tool-vocabulary collisions between harnesses — Copilot's `tools:` list uses namespaced identifiers (`vscode/*`, `execute/*`, MCP-server-scoped names) plus a Copilot-only `hooks:` block, while Claude's `tools:` field expects an entirely different vocabulary. A straight symlink under a multi-harness design would have silently produced a Claude agent with zero resolvable tools. With Claude as the only harness `capabilities` installs for (§2, §4), that collision can't happen, so the generation step (parse source → select harness block → strip the rest → write a derived file) is unnecessary complexity. Agent files are plain Claude-native frontmatter directly — `name`, `description`, `tools`, `model` — authored once, symlinked, no derived output, nothing regenerated on install.

**Follow-up needed:** the 5 agents currently in `traits/agents/` still carry a leftover `copilot:` frontmatter block from the original multi-harness design. Flattening them to plain Claude-native frontmatter is implementation work, not yet done as of this PRD update.

## 8. Rules

Named "rules" rather than "instructions" — "instructions" was Copilot's vocabulary; "rules" matches the Claude mechanism this category now targets (see below).

**Scope: global, workstation-level rules only.** (Project-specific `CLAUDE.md`/`AGENTS.md` are out of scope per §4 — including Claude's own _per-project_ `CLAUDE.md`, a different mechanism from the user-level rules folder this category targets.)

**Model: single source of truth, plain directory symlink — same as skills/agents (§6, §7).** `traits/rules/` symlinks wholesale to `~/.claude/rules/`. Flat, no sub-structure: no distinguished "global" single file, no `scoped/` subfolder. Every file in `traits/rules/` is just one more topic file, exactly like everything already living in Claude's own `~/.claude/rules/` directory.

**Correction to an earlier assumption:** this PRD originally stated Claude had no global-instructions mechanism at all, and separately modelled a distinguished "global" file (mapped to `~/.claude/CLAUDE.md`) alongside "scoped" topic files (mapped to `~/.claude/rules/`). Both were wrong. Claude does have a user-level `~/.claude/CLAUDE.md`, but a single do-everything global file is a project-shaped pattern — Claude's own primary use of `CLAUDE.md` is per-project — not a fit for workstation-global content, which is what this category is for (§4). `~/.claude/rules/`, a flat directory of independent topic files, is the better fit and the only mechanism this category now targets:

| Copilot                                                                                                      | Claude equivalent                                                   |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `~/.copilot/instructions.md`, `~/.copilot/instructions/*.instructions.md` (scoped via `applyTo` frontmatter) | `~/.claude/rules/*.md` (optionally scoped via `paths:` frontmatter) |

The frontmatter key mismatch (`applyTo` vs `paths`) means a rule file carried over from Copilot with `applyTo` scoping loads unconditionally for Claude rather than being narrowed to matching paths — lower-stakes than the agents collision problem (§7): nothing breaks, a rule just isn't scoped as tightly as intended. Left as-is for now; revisit if it causes noticeable context noise.

## 9. Content sensitivity / sanitization

Discovery surfaced real client-identifying content, all traceable to one client (*** / ***) that several skills/agents were originally written for:

| File                                             | Issue                                                             |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| `traits/agents/doc-agent.md`                     | Body written specifically for "the *** organisation"              |
| `traits/agents/iac-agent.md`                     | Body written specifically for "the *** portfolio of applications" |
| `traits/skills/dynamodb/SKILL.md`                | Stray `author: ***` frontmatter line                              |
| `traits/skills/jira/SKILL.md`                    | Hardcoded `***-aws.atlassian.net` in example commands             |
| `traits/skills/jira/references/custom-fields.md` | Same hardcoded Jira instance URL                                  |

Checked for a second known client context (FamStat/7Cats) — no hits. Contamination is scoped to exactly these 5 files.

**Decision: sanitize and include, don't exclude.** Most of this content is recognized as generically applicable beyond its original client context; genericizing the `author:` line and hardcoded URL is mechanical, genericizing the two agent bodies is an editorial rewrite — owner will do this personally.

**Sequencing: sanitize inside `capabilities/`, before `git init`/first commit.** Not in the original `~/.copilot` location, not after committing. Since the repo is going public, nothing client-identifying should ever enter git history — removing it after the fact would require a history rewrite/force-push.

No automated guardrail (e.g., pre-push content scanning) in v1 — deferred, manual review only, revisit if this recurs.

## 10. Migration plan (per machine)

The steps below describe the original migration, done while `capabilities` still had a multi-harness design (issues 1–6). A new machine, onboarded under the current Claude-only scope (§2, §4, §7), only needs steps 1, 4, 5 (Claude only), and 6.

1. Copy the union of `~/.claude/skills`, `~/.copilot/skills`, `~/.copilot/agents`, `~/.copilot/instructions.md`, `~/.copilot/instructions/` into `capabilities/traits/{skills,agents,rules}`.
2. ~~Convert the 5 Copilot agent files into the namespaced-frontmatter format~~ — no longer applicable; agents are plain Claude-native frontmatter (§7).
3. Sanitize the 5 flagged files in place within `capabilities/` (§9).
4. `git init`, first commit.
5. Run `capabilities install claude` to replace the original folders with symlinks into `capabilities/`.
6. Push to remote (assumed GitHub — see §14).

This is a **one-off manual/scripted pass, not a permanent CLI feature.** It repeats independently on each additional machine — each may have its own local drift to reconcile before symlinking, so `git clone` + `install` alone isn't sufficient there either.

## 11. CLI: `capabilities`

- **Language: Node.js**, using WinterCG-compliant Web APIs wherever a standards-track option exists (e.g. Web Crypto via global `crypto.subtle` for any future content-hash/drift checks). Filesystem access, symlink creation, and shelling out to `git`/`jj` have no WinterCG equivalent and necessarily use `node:fs` / `node:child_process`.
- **YAML parsing via the [`yaml`](https://www.npmjs.com/package/yaml) npm package** — zero dependencies of its own, already used in other projects, and more reliable than a hand-rolled parser if the schema grows. A deliberate exception to the zero-dependency-bias philosophy: minimalism is a default, not a rule, and a well-vetted, dependency-free library beats reinventing a YAML parser.
- **Entry point:** `bin/capabilities`, symlinked into `~/bin` (already on PATH).

Subcommands:

| Command                            | Purpose                                                                                                                                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities install <harness>`   | Symlinks skills/agents/rules wholesale (§6, §7, §8). Idempotent. If the target path already exists as a real (non-symlink) directory, refuse and warn rather than overwrite — first-machine migration is handled separately (§10), not by `install`. |
| `capabilities uninstall <harness>` | Reverses `install`.                                                                                                                                                                                                                                  |
| `capabilities status`              | Reports, per known harness/category, whether symlinks are present, correct, missing, or broken.                                                                                                                                                      |
| `capabilities sync`                | fetch → merge/rebase → commit → push, in one command. Named `sync` rather than `update` to avoid ambiguity with git's own overloaded meaning.                                                                                                        |
| `capabilities new skill <name>`    | Scaffolds a new `SKILL.md` from a template.                                                                                                                                                                                                          |

## 12. `capabilities.yaml` schema

```yaml
harnesses:
  claude:
    skills: ~/.claude/skills
    agents: ~/.claude/agents
    rules: ~/.claude/rules
```

- Nested under a top-level `harnesses` key (not flat) to leave room for adding another harness later without a breaking restructure — not an active goal today (§2, §4), but free to keep.
- A missing category under a harness means "not applicable," not an error.
- Only `claude:` is populated. Earlier drafts of this schema also carried `copilot:`/`pi:` entries; those are dropped from the working schema now that multi-harness support is out of scope (§4).

## 13. Deferred / explicitly not doing now

- Multi-harness support beyond Claude — superseded by trAIt (§2).
- chezmoi or any other dotfile-manager integration.
- Automated content-safety scanning in `sync`.
- A general-purpose/repeatable `capabilities migrate` subcommand.
- Reconciling the `applyTo`/`paths` frontmatter mismatch for rules carried over from Copilot (§8).

## 14. Open items to confirm

- Git host — assumed GitHub, matching the existing `~/dev/TroyForster/...` convention. Not yet explicitly confirmed.
- License choice — deferred until the repo is actually made public.

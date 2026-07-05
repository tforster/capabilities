# Architecture <!-- omit in toc -->

How `capabilities` is put together, and why.

## Table of Contents <!-- omit in toc -->

- [1. Background](#1-background)
- [2. Relationship to trAIt](#2-relationship-to-trait)
- [3. Repository Layout](#3-repository-layout)
- [4. `capabilities.yaml`](#4-capabilitiesyaml)
- [5. CLI and Modules](#5-cli-and-modules)
- [6. Install Model: Plain Symlink, Everywhere](#6-install-model-plain-symlink-everywhere)
- [7. Rules and Claude's `paths:` Scoping](#7-rules-and-claudes-paths-scoping)
- [8. Atomic Install](#8-atomic-install)
- [9. Status Model](#9-status-model)
- [10. `sync`](#10-sync)
- [11. Testing Strategy](#11-testing-strategy)
- [12. Dependencies and Version Control](#12-dependencies-and-version-control)
- [13. Further Reading](#13-further-reading)

## 1. Background

Skill, agent, and rule files for AI coding harnesses tend to scatter across `~/.claude/`, `~/.copilot/`, etc., with no single source of truth and no way to keep them consistent across machines. `capabilities` is one workstation-global repository for skills, agents, and rules, synced across machines via git.

## 2. Relationship to trAIt

[trAIt](https://github.com/tforster/trait) is a separate, more ambitious proposal — a distributed-wiki model for AI agent files, multi-author, multi-harness. `capabilities` is not that. It is explicitly **scaffolding**: a small, single-author tool that keeps skills, agents, and rules in sync across three machines, for a single harness (Claude). It's meant to be retired once trAIt has a working implementation worth migrating to — every design choice below favours "simple and good enough for one person" over generality.

## 3. Repository Layout

```text
capabilities/
├── README.md
├── capabilities.yaml        # harness registry — see §4
├── bin/
│   └── capabilities         # CLI entry point, symlinked into ~/bin
├── lib/                     # CLI implementation, one module per concern
├── traits/                  # nod to trAIt (§2) — everything installed into a harness
│   ├── skills/
│   │   └── <skill-name>/SKILL.md
│   ├── agents/
│   │   └── <agent-name>.md  # Claude-native frontmatter: name, description, tools, model
│   └── rules/
│       └── <topic>.md
└── prd.md
```

`skills/`, `agents/`, `rules/` live under one `traits/` parent, kept visually and structurally distinct from `docs/`, `test/`, `lib/`, and the rest of the tooling.

## 4. `capabilities.yaml`

A harness registry, nested under a top-level `harnesses` key so future sibling keys don't force a breaking restructure. Only `claude:` is populated:

```yaml
harnesses:
  claude:
    skills: ~/.claude/skills
    agents: ~/.claude/agents
    rules: ~/.claude/rules
```

A category missing under a harness means "not applicable," not an error.

## 5. CLI and Modules

`bin/capabilities` is a single Node.js ESM entry point, symlinked into `~/bin`. It resolves its own real path via `import.meta.url`, so it works whether invoked directly or through a symlink. Each subcommand is a thin wrapper over one `lib/` module:

| Command                            | Module                          |
| ---------------------------------- | ------------------------------- |
| `capabilities install <harness>`   | `lib/install.js`                |
| `capabilities uninstall <harness>` | `lib/install.js`                |
| `capabilities status`              | `lib/status.js`                 |
| `capabilities sync`                | `lib/sync.js` (via `lib/jj.js`) |
| `capabilities new skill <name>`    | `lib/new-skill.js`              |

`lib/config.js` parses `capabilities.yaml` and expands leading `~` to the home directory; every other module takes the parsed config as a plain object.

## 6. Install Model: Plain Symlink, Everywhere

`skills/`, `agents/`, and `rules/` all use the same model: `lib/install.js` symlinks each whole directory into the harness's configured path. `capabilities install claude` produces `~/.claude/skills`, `~/.claude/agents`, `~/.claude/rules` — each a directory symlink into `traits/`. One rule, three categories, no exceptions, no per-category code.

Agent files are plain Claude-native frontmatter (`name`, `description`, optionally `tools`/`model`) — no per-harness variation, since Claude is the only harness `capabilities` installs for (§2).

## 7. Rules and Claude's `paths:` Scoping

`traits/rules/` is flat — every file in it is an independent topic file, symlinked wholesale to `~/.claude/rules/`. Claude scopes a rule file to specific paths via `paths:` frontmatter; a rule file without it loads unconditionally on every session. `capabilities` doesn't manage or validate that frontmatter — it's just markdown content being symlinked, same as everything else in `traits/`.

## 8. Atomic Install

`install` refuses, without making any changes, if a harness's target path already exists as a real (non-symlink) directory. To guarantee "no changes on refusal" holds even when a harness configures multiple categories, `install` runs in two phases: it first validates every applicable category (already-correct symlink, conflicting real directory, or fresh path to create), builds a plan, and only then applies it. A conflict on the second category can't leave the first partially installed, because nothing is written until every category has been validated.

Re-running `install` on an already-correct symlink is a no-op by the same mechanism — if the existing symlink already resolves to the expected source, that category is skipped in the plan.

## 9. Status Model

`capabilities status` reports one of four states per harness, per category:

| State            | Meaning                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `not-applicable` | The harness doesn't configure this category at all                                             |
| `missing`        | Configured, but nothing exists at the target path yet                                          |
| `broken`         | A real directory blocks the symlink, the symlink points somewhere unexpected, or it's dangling |
| `correct`        | Installed exactly as expected                                                                  |

The same symlink-resolution check applies uniformly to `skills`, `agents`, and `rules` — no per-category special-casing.

## 10. `sync`

`capabilities sync` wraps `jj git fetch` → integrate → `jj describe` → `jj git push` into one command. `lib/sync.js` takes its `jj` runner as an injected parameter rather than shelling out directly, so the sequencing logic is testable without a real git remote. `lib/jj.js` is the one concrete implementation of that runner, and the only module that shells out via `node:child_process` for version control.

Two behaviours worth knowing:

- A conflict surfaced by `jj rebase` (detected by pattern-matching its output for "conflict") aborts the sequence **before** `describe` or `push` run.
- `describe` only runs when `jj diff --stat` reports actual working-copy changes, so a no-op `sync` doesn't clobber an existing commit description.

## 11. Testing Strategy

Filesystem-backed modules are tested against real temporary directories rather than a mocked `fs` — the behaviour under test _is_ filesystem symlink manipulation, so faking `fs` would only test a hand-written stub. `bin/capabilities` is tested by spawning it as an actual child process, including through a symlink.

`sync` is the exception: its correctness is entirely about _sequencing_ jj calls and reacting to their output, and a real git remote is exactly the kind of external boundary worth mocking.

## 12. Dependencies and Version Control

`capabilities.yaml` is parsed with the [`yaml`](https://www.npmjs.com/package/yaml) npm package rather than a hand-rolled parser — the one deliberate exception to an otherwise zero-dependency codebase.

The repository is a normal git repository under the hood, but local development uses [Jujutsu](https://jj-vcs.github.io/jj/) (`jj`) on a colocated git backend. `capabilities sync` (§10) is written against jj's own vocabulary (`describe`, bookmarks) rather than git's.

## 13. Further Reading

- [`prd.md`](../../prd.md) — the design discussion and open items behind this architecture
- [`issues.md`](../../issues.md) — the issue-by-issue build log

[← Back to Explanation](./README.md)

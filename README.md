# capabilities <!-- omit in toc -->

_Single source of truth for workstation-global AI skills, agents, and instructions, kept in sync across machines and coding harnesses._

## Table of Contents <!-- omit in toc -->

- [About](#about)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Known Issues](#known-issues)
- [Change Log](#change-log)
- [Contributing](#contributing)
- [License](#license)

## About

`capabilities` is a personal, single-harness (Claude-only) tool that keeps `traits/{skills,agents,rules}` in sync across machines and symlinks them into `~/.claude/`.

It exists because skill, agent, and instruction files had accumulated independently across `~/.claude/skills` and `~/.copilot/skills` through a history of switching harnesses (Copilot → pi → Claude), with no single source of truth, no standard format, and no way to keep them consistent across machines.

**Key points:**

- One canonical copy of skills, agents, and rules, git-synced across machines
- Symlinked wholesale into a harness's config directory — no per-category special-casing
- Deliberately minimal: "simple and good enough for one person" over generality
- Explicit scaffolding for a more ambitious sibling project, [trAIt](https://github.com/tforster/trait), and is meant to be retired once trAIt has a working implementation worth migrating to

See [`docs/explanation/architecture.md`](./docs/explanation/architecture.md) for the full design rationale and [`docs/reference/prd.md`](./docs/reference/prd.md) for the original design discussion and open items.

## Quick Start

**Prerequisites:** Node.js, npm

```bash
# Clone and install
git clone <repo-url> capabilities
cd capabilities
npm install

# Symlink traits/{skills,agents,rules} into ~/.claude/
capabilities install claude

# Check what's currently linked
capabilities status

# Pull/push changes across machines
capabilities sync

# Scaffold a new skill under traits/skills/
capabilities new skill <name>
```

```bash
npm test                              # full test suite (node:test)
npm run lint                          # oxlint
npm run format                        # oxfmt --write
npm run format:check                  # oxfmt --check (no write)
npm run typecheck                     # tsc --noEmit -p jsconfig.json
```

## Documentation

Documentation follows the [Diátaxis framework](https://diataxis.fr):

- **[Tutorials](./docs/tutorials/README.md)** — step-by-step guides for getting started
- **[How-To Guides](./docs/how-to/README.md)** — practical guides for specific tasks
- **[Reference](./docs/reference/README.md)** — specs, the PRD, and the issue tracker
- **[Explanation](./docs/explanation/README.md)** — architecture and design rationale

📚 **Start here:** [Documentation Index](./docs/README.md)

> [!NOTE]
> Tutorials and how-to guides are still stubs — this is a young, single-user tool. Reference (`prd.md`, `issues.md`) and Explanation (`architecture.md`) are the most complete sections today.

## Known Issues

There's no external issue tracker yet — open items are tracked in [`docs/reference/issues.md`](./docs/reference/issues.md) until one is adopted. Notably still open:

- Confirm the git host and push the repo remotely

## Change Log

No `CHANGELOG.md` yet. For now, `git log` is the change history.

## Contributing

This is a personal, single-user tool and isn't set up to take outside contributions. If you're working in this codebase, `CLAUDE.md` and `docs/explanation/architecture.md` are the places to start.

## License

MIT License — see [LICENSE](./LICENSE) for details.

**Author:** Troy Forster ([@tforster](https://github.com/tforster)) — <troy.forster@gmail.com>

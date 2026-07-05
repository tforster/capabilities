# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`capabilities` is a personal, single-harness (Claude-only) tool that keeps `traits/{skills,agents,rules}` in sync across machines and symlinks them into `~/.claude/`. It is explicitly scaffolding — see `docs/explanation/architecture.md` §2 for its relationship to the more ambitious [trAIt](https://github.com/tforster/trait) proposal. Favour "simple and good enough for one person" over generality in any change here.

Full design rationale lives in `docs/explanation/architecture.md` (current state) and `prd.md` (design discussion/open items) — read `docs/explanation/architecture.md` first for any non-trivial change.

## Commands

```bash
npm test                              # full suite (node:test)
node --test test/install.test.js      # single file
node --test --watch                   # watch mode
npm run lint                          # oxlint
npm run format                        # oxfmt --write
npm run format:check                  # oxfmt --check (no write)
npm run typecheck                     # tsc --noEmit -p jsconfig.json — JSDoc types, no .ts files
```

**After every change**, run `npm run lint` and `npm run typecheck` (and `npm test` if you touched behaviour) before considering the task done. Type checking is JSDoc-based — this is a plain-JS codebase (`checkJs: true` in `jsconfig.json`, no `.ts` files) — so a missing or wrong `@param`/`@returns` shows up as a `typecheck` failure, not just an IDE nit. `traits/` is excluded from all three (it's installable content, not this tool's own source).

## Architecture

- **Entry point**: `bin/capabilities` (ESM, no extension) — resolves its own real path via `import.meta.url` so it works when invoked through a symlink (e.g. `~/bin/capabilities`). Each subcommand delegates to one `lib/` module; see `docs/explanation/architecture.md` §5 for the map.
- **One install model for everything**: `skills/`, `agents/`, `rules/` under `traits/` are all symlinked wholesale by `lib/install.js` — there is no per-category special-casing anywhere in the codebase (§6). If you're about to add a `agents`-only or `rules`-only code path, that's very likely wrong.
- **`lib/install.js`'s `install()`/`uninstall()` are two-phase**: validate every category first, build a plan, then apply — so a conflict on category N never leaves category 1..N-1 partially installed (§8). Preserve this when touching install logic.
- **`lib/status.js`** reuses `lib/install.js`'s `symlinkCategories()` directly rather than duplicating the category map.
- **`lib/sync.js`** takes its `jj` runner as an injected function rather than shelling out directly — this is what makes its sequencing logic testable without a real git remote. `lib/jj.js` is the only module that shells out via `node:child_process`.
- **Testing convention**: filesystem-backed modules are tested against real temp directories (`node:fs/promises` + `mkdtemp`), not a mocked `fs` — the behaviour under test _is_ filesystem/symlink manipulation. `sync` is the one module tested with a faked dependency (the injected `jj` runner), since a real git remote is a genuine external boundary. Follow whichever pattern matches the module you're touching.
- **`bin/capabilities` is tested by spawning it as a real child process**, including through a symlink — not by importing its internals.

## Code style

- ESM only (`"type": "module"`), explicit `.js` extensions on local imports
- JSDoc on all functions; reusable object shapes go in `lib/types.js` as `@typedef`s and are referenced via `import("./types.js").TypeName`, not repeated inline
- 2-space indent, double quotes, 132 char line width — enforced by `oxfmt` (`.oxfmtrc.json`), not manual

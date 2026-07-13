# Dev0 Framework -- Design Review <!-- omit in toc -->

The consolidated output of the grilling session of 2026-09-10/11, revised by a second grilling session on 2026-09-13 (revised decisions are marked _Revised 2026-09-13_; new ones start at D59). This document exists so you can confirm or reject each decision in one sitting, before anything is built.

It is deliberately **ephemeral**. Once confirmed, its content disperses into durable homes (§17) and this file ages out of `docs/scratch/` under the 28-day retention rule it specifies. Do not cite it from anywhere.

## Table of Contents <!-- omit in toc -->

- [1. How to use this document](#1-how-to-use-this-document)
- [2. The thesis](#2-the-thesis)
- [3. Dev0](#3-dev0)
  - [3.1. Core Tenets of Dev0](#31-core-tenets-of-dev0)
  - [3.2. The Strategic Decision Matrix: Examples in Practice](#32-the-strategic-decision-matrix-examples-in-practice)
  - [3.3. Dev0 exists in four drifting copies today](#33-dev0-exists-in-four-drifting-copies-today)
  - [3.4. Judgement gates](#34-judgement-gates)
  - [3.5. Code rules v1](#35-code-rules-v1)
- [4. Documentation architecture](#4-documentation-architecture)
  - [4.1. The diagnosis](#41-the-diagnosis)
  - [4.2. The ownership rule](#42-the-ownership-rule)
  - [4.3. The cascade](#43-the-cascade)
  - [4.4. Vocabulary](#44-vocabulary)
  - [4.5. Ephemeral area](#45-ephemeral-area)
- [5. Decision memory](#5-decision-memory)
- [6. The three tiers](#6-the-three-tiers)
- [7. The global layer](#7-the-global-layer)
- [8. The toolkit](#8-the-toolkit)
- [9. Enforcement](#9-enforcement)
- [10. Trackers](#10-trackers)
- [11. The autonomous loop](#11-the-autonomous-loop)
- [12. Agents and models](#12-agents-and-models)
- [13. Skills, plugins and context budget](#13-skills-plugins-and-context-budget)
- [14. Worktree ergonomics](#14-worktree-ergonomics)
- [15. Build order](#15-build-order)
- [16. Phase 0 -- unverified assumptions](#16-phase-0----unverified-assumptions)
- [17. Where this document goes next](#17-where-this-document-goes-next)

## 1. How to use this document

Every decision carries an ID (`D1`, `D2`, ...). Comment inline in the Markdown, or reply with `D7: no, because ...`. The file is committed, so subsequent edits are diffable against this initial version.

Each decision records what was **rejected** as well as what was chosen. The rejections are the load-bearing part: a codebase records what you built and can never record what you ruled out, so an agent with no rejection record re-proposes React, `feat/` branch prefixes and a Diátaxis `explanation/` tree forever.

## 2. The thesis

One sentence, because everything else is downstream of it:

> You currently spend your judgement **after** generation, stripping verbose code out of diffs -- repeatedly, per file. This framework moves that spend **before** generation: once, on prose, answering questions rather than authoring. A spec constrains every file the loop touches; a post-hoc edit fixes one.

**D1.** The framework's shape follows from that:

> **You own spec and architecture. Agents own construction and verification. The signed spec is the boundary.**

Everything upstream of that line is HITL and exists to sharpen your thinking (`grilling`, `to-spec`, `domain-modeling`). Everything downstream is AFK and exists to execute without interpreting (the loop, the code rules, the hooks, the verification triad). This becomes the first line of `philosophy.md`, because it tells an agent which half of the world it is in.

## 3. Dev0

Dev0 is my attempt to name the way I architect and build software based on my 40 years of experience. "Zero-Based Architecture".

Dev0 (Zero-Based Development) is an architectural and engineering philosophy that rejects default industry bloat in favour of intentionality, ruthless simplicity, and structural clarity. Rather than treating minimalism as mere "code golf" or dogmatic asceticism, Dev0 applies a zero-based mindset across the entire software lifecycle: start from an absolute baseline of zero assumptions, zero abstractions, and zero dependencies, requiring every single addition to justify its existence against the whole system.

### 3.1. Core Tenets of Dev0

- Holistic-First Systems Thinking: Architecture begins at the perimeter. Dev0 starts with a wide-angle view of the problem space to delineate bounded contexts and business domains before writing a line of code. It deliberately zooms from macro to micro while keeping the overall system topology in focus.

- C4 Model Alignment: Dev0 leverages the C4 model (Context, Containers, Components, Code) because it reflects this exact zooming mechanism. It ensures developers never lose the forest for the trees, avoiding the trap of hyper-optimising a leaf component at the expense of container-level simplicity.

- Strategic Dependency Evaluation: Dev0 does not forbid third-party dependencies; it forbids unexamined ones. When evaluating an external package, the architect must weigh its business and functional value against its total footprint.

- Full Dependency-Tree Accountability: An architect is responsible not just for the top-level package, but for the entire transitive tree. A 5 KB utility that drags in 40 indirect packages, cyclic dependencies, or heavy build tooling fails the Dev0 standard.

- Respect for the Platform: The native platform -- standardised browser APIs, the raw runtime, standard protocols, semantic HTML -- is the default framework. Dev0 relies on the platform first before layering abstractions.

### 3.2. The Strategic Decision Matrix: Examples in Practice

- The Justified Inclusion: Markdown parsing in a presentation engine like Deck0. Parsing CommonMark involves extensive specification edge cases, security sanitisation considerations, and complex tokenisation. Using a single, battle-tested, focused library like marked is a strategic Dev0 decision: the problem is solved, specialised, and avoids reinventing a massive wheel, while keeping direct and transitive overhead bounded.

- The Rejected Inclusion: Pulling in an entire UI component framework or state management library to render a clean slide or toggle a modal. The platform already provides semantic tags, CSS Grid, Scroll Snap, and native DOM APIs that accomplish the task with zero runtime weight.

- The Semantic Delimiter: Choosing native `<h1>` tags as presentation slide boundaries rather than inventing custom metadata schemas or parser syntax. The structure of the document is the interface, maintaining compatibility with standard Markdown renderers without adding parser overhead.

Dev0 shifts the default developer posture from "Why shouldn't we add this?" to "Does this component earn the right to exist in our system?" It replaces passive accretion with active, conscious architecture.

**D59 -- The tenets are for the architect, not the agents.** _Added 2026-09-13._ The introduction, the tenets and the decision matrix above move to `DEV0.md` at the root of the toolkit repo, linked from the first line of its README. Agents never load it: `philosophy.md` carries only D1, the gates and the code rules. Weighing a dependency is the architect's judgement, upstream of the D1 boundary; agents are downstream and default-deny (D3). The one exception is the Dev0 review agent (D48), whose job is judgement.

_Rejected:_ tenets in `philosophy.md` with a "weighing is the architect's job" caveat (~650 tokens in every session and subagent, and "forbids _unexamined_ ones" is exactly the sentence a model quotes to justify Zod); rewriting the tenets to be agent-safe (they are right as written, for their audience).

### 3.3. Dev0 exists in four drifting copies today

This is the single best explanation for why agent output does not look like your code.

| Location                                       | Says                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `traits/rules/philosophy.md`                   | minimalism, zero-dependency bias, native-first                                                                          |
| `traits/agents/cqrs-api-architect.md`          | _"Zero-Based Development philosophy: minimal dependencies, no bloaty frameworks"_                                       |
| `traits/agents/SeniorDev.md`                   | _"40 years of experience. You value simplicity over abstraction."_                                                      |
| `platform` `workspaces/agents/skills/harness/` | _"Low-Fat ESM JavaScript standards and surgical code changes"_ -- **inert; no frontmatter, outside any discovery path** |

Four names for one doctrine, each an incomplete subset, one unreachable. Whichever happens to be in context decides how the code comes out. **D2: `philosophy.md` becomes the single source; the other three are deleted or merged into it.** Refined by D59: the tenets go to `DEV0.md`, not `philosophy.md`.

### 3.4. Judgement gates

**D3 -- Dependencies: default-deny.** Zero new runtime dependencies without asking. No agent-side justification is accepted. The agent may hand-roll, or stop and ask. Existing dev tooling (`oxlint`, `oxfmt`, `node:test`, `tsc`) is already approved; anything new -- runtime **or** dev -- is the architect's decision. _Revised 2026-09-13:_ the dependency gate (D29) therefore blocks `-D` installs too. A bare `npm install` or `npm ci` passes, since it installs only what `package.json` already approves.

_Rejected:_ a budget (arbitrary; you would argue the number instead of the decision); a checklist of tests the dependency must pass (more prose to rationalise against); blocking runtime installs only (contradicts architect-owned tooling); different refusal messages for dev and runtime (flag parsing that changes nothing the agent does -- it stops and asks either way).

**D4 -- Abstraction: the rule of three.** Write the direct version. Abstract on the **third** repetition, not the second. Countable, so the agent can be told it is wrong.

**D5 -- Docs: a doc is written when an issue asks for it, or a public interface changed.** Never speculatively. You currently have six mechanisms describing _how_ to write docs and none describing _whether_ -- that asymmetry is why agents bury you.

**D6 -- Tests are not a Dev0 gate.** `testing.md` already settles them (moving into the `javascript` skill, D25).

The three gates share one shape, which generalises the doctrine past dependencies: **default to the direct thing; earn the indirection with a counted trigger.**

### 3.5. Code rules v1

Derived from the edits you actually make to agent output. Phrased **positively**: steering by prohibition drags the forbidden behaviour into context and makes it more available, not less.

| #   | Rule                                                                                                                                                                                             | Trigger    | Rationale                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Validate at the boundary, then trust.** Inside a module, arguments are the type the JSDoc declares.                                                                                            | --         | Bad input arrives at the edge, so one gate there is enough. Re-checking inside duplicates the JSDoc contract `tsc` already enforces and buries logic in defensive noise.                  |
| 2   | **Let errors propagate to the boundary.** Catch only to add information, convert to a `Response`, or release a resource.                                                                         | --         | Scattered catch-and-log swallows failures and strips context. One boundary handler decides status and logging consistently.                                                               |
| 3   | **A function lives in the file that calls it** until a second caller exists.                                                                                                                     | 2nd caller | Extracting early guesses at reuse and adds indirection. The second caller reveals the real shape, and moving it then is cheap.                                                            |
| 4   | **Return the expression.** `return await x()`, `return !!x`.                                                                                                                                     | --         | A temp variable or `if`/`else` adds lines and names that mean nothing. Keep the `await` -- only an awaited rejection reaches a local `catch`, and the async stack trace keeps this frame. |
| 5   | **Comments carry what the code cannot** -- why, intent, edge cases, the rejected alternative. Write them liberally.                                                                              | --         | Code already says what and how. Without the why, the next reader -- human or agent -- re-derives the decision or undoes it.                                                               |
| 6   | **Up to four parameters are positional.** Five or more take an options object.                                                                                                                   | 5th param  | Past four, call sites become order-dependent guesswork. Named properties document themselves and tolerate optional arguments.                                                             |
| 7   | **Import from the module that defines the symbol.** A barrel earns its place only at a published API boundary.                                                                                   | --         | Barrels hide where code lives, invite circular imports, and load more than needed. Direct imports keep dependencies greppable.                                                            |
| 8   | **Name a literal when the name says something the value does not**, or when it is used twice. Otherwise inline it.                                                                               | 2nd use    | A constant for a self-evident value makes the reader jump to learn nothing. A name pays when it adds meaning or keeps two uses in sync.                                                   |
| 9   | **Call the function directly** -- no forwarding wrapper.                                                                                                                                         | --         | A wrapper that only forwards adds a name, a JSDoc block, and a jump, yet no behaviour -- and it hides the real call.                                                                      |
| 10  | **Independent awaits run in parallel** -- `Promise.all` / `allSettled` / `any`.                                                                                                                  | --         | Sequential awaits of unrelated work add their latencies for nothing. The combinator also states intent: all required, failures tolerated, or first wins.                                  |
| 11  | **JSDoc is the type system, not prose.** Every parameter and return typed. `@description` only when the function needs explaining -- a short, self-evident function gets types and nothing else. | ~6 lines   | With `checkJs`, types are verified; prose restating the signature is unverified, goes stale, and is the noise you delete (D7).                                                            |
| 12  | **Braces on every `if`**, always the multi-line form.                                                                                                                                            | --         | A braceless `if` invites the added-second-line bug and noisier diffs. Mechanical, so `oxlint` enforces it (D9).                                                                           |

**D7.** Rule 11 supersedes the current `philosophy.md` §4, which mandates `@description` on _every_ function and has therefore been actively producing the JSDoc noise you then delete.

**D8.** Optional-chaining guards are **not** a strip pattern -- they stay. _(Parked: `tsc --noEmit` with `checkJs`, which you already run, is precisely the tool that proves a value cannot be null. Revisit once typecheck is clean.)_

**D9.** Rule 12 is enforced by `oxlint` (`curly: ["error", "all"]`), never by instruction. Rule 13 -- _local static serving is `npx static-server <path>`_ -- is not a rule at all but an accepted-dependency precedent, so it becomes the first entry in `install/adr/`.

**D10.** JavaScript first, on `oxlint`/`oxfmt`. `html`, `css`, `json`, `sql`, `md` are parked and surgically backfilled once the pattern is proven. `lint:content` in `platform` already covers most of them, so the backfill is wiring, not new tooling. ESLint is rejected (global ADR): its config bloats with plugins and demands constant attention as formats and interfaces change. PHP is the exception -- D60.

**D60 -- PHP is a fast-follow.** _Added 2026-09-13._ `legacy.web` (a large legacy PHP monolith) is being strangler-fig'd into `platform` over at least two years. New PHP -- interception and rerouting code, including the switch to SSO -- has to survive that long, so it is tested and held to Dev0.

- **Rules split by directory, not by language.** New strangler code (`fig/`, namespace `App\Fig`) follows the Dev0 code rules and requires tests, via its own cascade `CLAUDE.md`. The legacy tree follows the surgical-change rule: touch only what the issue needs, never refactor legacy, new logic goes in `fig/`.
- **A `php` skill** carries what both share: the production PHP syntax ceiling, PSR-12 plus the repo's `php-cs-fixer` config, and the directory split. Seeded from `SeniorDev` before D48 deletes it.
- **Testing:** the newest PHPUnit that supports production PHP inside the `legacy-web-1` container for `fig/` units; Playwright characterisation tests at the HTTP boundary for every reroute -- same request, same observable result before and after interception.
- **Hooks (Phase 2b):** `php-cs-fixer` on the changed file; `php -l` inside `php:<production>-cli`, because local PHP is newer and syntax that runs locally can break production; the completion gate runs `devops/test.sh --phpunit`.

_Rejected:_ no Dev0 rules for any PHP (new interception code lives two-plus years); Dev0 rules for all PHP (rewriting legacy that is being strangled is waste and risk); the production syntax ceiling by instruction only (decays over a session; the container lint does not); PHPCompatibility via `phpcs` (a new dev tool for marginal gain).

_Parked for the `legacy.web` rollout:_ whether the existing SSO library moves into `fig/`.

## 4. Documentation architecture

### 4.1. The diagnosis

Diátaxis gives a **categorisation** rule -- which of four folders -- but no **ownership** rule. So when an agent holds a fact, Diátaxis always answers "yes, it goes somewhere" and never "no, this already lives in the code." Hence contradiction and duplication. `markdown.md` §5 states anti-duplication but nothing can enforce it.

Measured on `platform`:

|                           |                                                    |
| ------------------------- | -------------------------------------------------- |
| `docs/` total             | 165 `.md`, **4.8 MB**                              |
| `explanation/`            | **83 files, 2.3 MB -- half the doc mass**          |
| Largest singles           | 51 KB, 49 KB, 48 KB, 42 KB -- **~13k tokens each** |
| Domains in `explanation/` | 4, against **16 workspaces**                       |
| `platform/`               | ~60% of `explanation/`, and **is not a workspace** |
| `CLAUDE.md` files         | **zero**                                           |

`platform/` being both the largest bucket and the one with no code is causation, not coincidence: **docs sprawl precisely where nothing owns them.**

### 4.2. The ownership rule

**D11.** One line, and it is the rule Diátaxis never had:

> **`docs/` holds nothing an agent reads as prose.** Agent knowledge is co-located `CLAUDE.md`. `docs/reference/` holds machine-readable specs (OAS, design tokens); `docs/runbooks/` holds human procedures; `docs/adr/` holds decisions, especially rejections.

The ADR template is Pocock's, with one addition -- D62.

**D12.** `tutorials/` and `explanation/` are dropped; `how-to/` is renamed `runbooks/`. `tutorials/` onboards strangers you do not have. `explanation/` is where agent essays breed, and its legitimate content -- the _why_ -- belongs beside the code it explains.

**D13.** Dropping `explanation/` is a **harvest, not a delete**. 2.3 MB contains real value. This needs a repeatable extraction procedure and is the framework's best first real job.

**D61 -- Long-form lives in the tracker's paired wiki.** _Added 2026-09-13._ Confluence for Jira projects, Paca Docs for Paca projects, the ADO wiki for Azure DevOps projects -- declared in the root `CLAUDE.md` beside the tracker (D33). The `explanation/` harvest **extracts first**: the _why_ goes into `CLAUDE.md`, `CONTEXT.md` and ADRs, and only the residual narrative moves to the wiki. This also answers where D23's linked long-form assets live.

_Rejected:_ moving all 2.3 MB to Confluence now and extracting later (once out of the agent's reach, the extraction never happens); no long-form home for ADO projects.

**D14.** `arc42` is dropped entirely. **C4 stays** as a diagram specification invoked when a document needs a diagram -- a diagram is a far denser encoding than 30 KB of prose. C4 is one diagram type among several: use sequence, flow or state diagrams where they convey the information better. Always Mermaid, in Markdown.

### 4.3. The cascade

**D15.** The directory tree **is** the information hierarchy:

```text
CLAUDE.md                        always loaded    → @CONTEXT-MAP.md import, pointers, tracker + wiki declaration. 6 KB budget (D63).
workspaces/CLAUDE.md             any workspace    → the HLA, C4 context + container diagrams
workspaces/iam/CLAUDE.md         iam only         → that context's architectural summary
workspaces/iam/lib/CLAUDE.md     iam/lib only     → local gotchas
devops/CLAUDE.md                 devops only
```

Depth equals specificity equals laziness of loading. This beats a pointer-based scheme on every axis: there is no pointer wording to get weakly right, it cannot desync because moving the code moves the doc, it is free until relevant, and ownership is automatic -- the answer to "where does this go?" is always "beside the code it describes", and if no code claims it, that is the signal it is an ADR or it is dead.

Consequence: the framework is **Claude-dependent**. `CLAUDE.md`, the cascade and hooks are Claude Code mechanisms, and other models or harnesses will perform worse. Recorded as a global ADR (Claude-only harness accepted); the `AGENTS.md` symlink (D17) is the only hedge.

**D16.** `docs/reference/architecture.md` is **cancelled** -- the HLA lives at `workspaces/CLAUDE.md`. Splitting per-context summaries from the system-level one across two trees was an inconsistency in the first draft of this design.

**D17 -- Two files per context.** _Revised 2026-09-13; the original said there is no `CONTEXT.md`._ Pocock's skills, which are never forked (D52), treat `CONTEXT.md` as a contract: `domain-modeling` and `improve-codebase-architecture` write it eagerly, and `tdd` and `diagnosing-bugs` read it. So each context keeps **`CLAUDE.md` for mechanism** (auto-loaded by the cascade) and **`CONTEXT.md` for vocabulary** (Pocock's glossary format, loaded when a skill asks). `architectural-summary.md` collapses into the co-located `CLAUDE.md`. `AGENTS.md` becomes a symlink to `CLAUDE.md` as cheap insurance.

_Rejected:_ `CLAUDE.md` only, with an `## Agent skills` block redirecting the skills (points `domain-modeling`'s eager glossary writes at always-on files); symlinking `CONTEXT.md` to `CLAUDE.md` (the same outcome, disguised).

**D18.** `docs/agents/` disappears; the tracker declaration and the Pocock-compatibility notes fold into the project root `CLAUDE.md`.

### 4.4. Vocabulary

**D19.** Ubiquitous language is split by **reach**, which mirrors the DDD model. _Revised 2026-09-13 to follow D17._

|                                                                                       | Where                                                  | Load                                              | Promotion rule                                       |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------- |
| **Published language** -- terms crossing contexts (Customer, Order, Account, Context) | root `CONTEXT-MAP.md`, `## Published Language` section | always, via `@CONTEXT-MAP.md` in root `CLAUDE.md` | a term earns root when it appears in **≥2 contexts** |
| **Context-local language**                                                            | `workspaces/<ctx>/CONTEXT.md`                          | on demand                                         | everything else                                      |

Pocock's `CONTEXT-MAP.md` already lists the contexts (name, path, purpose) and their relationships; the published-language section is an addition his format tolerates. Importing the map routes agents to the right bounded context from the first turn, from a single source -- the root `CLAUDE.md` does not repeat the context list. Single-context repos have a root `CONTEXT.md` and no map.

Mechanism is needed when you _touch_ code; vocabulary is needed when you _talk about_ the domain -- writing a ticket, naming a variable -- which happens outside the subtree. Hence the root weighting. The promotion rule is countable, which is what holds the root file's size down.

_Rejected:_ a routing table in the root `CLAUDE.md` alongside the map (the same list maintained twice); a one-line pointer to the map instead of an import (routing then depends on the agent choosing to open it).

**D63 -- Root budget: 6 KB.** _Added 2026-09-13._ The root `CLAUDE.md` plus everything it imports stays under **6 KB** (~1.5k tokens), measured in **bytes** -- lines are gameable, tokens need a tokenizer. A global `PostToolUse` hook on writes to `CLAUDE.md`, `CONTEXT-MAP.md` or `CONTEXT.md` measures root plus imports and **warns** when over: over budget means push content down the cascade, not an emergency. A runbook in the toolkit's `docs/runbooks/` explains how to push content down -- the part a hook cannot say. The number is a guess, revisited once the Phase 6 harvest gives `platform` a real root to measure.

_Rejected:_ a runbook alone (instruction decays, D24); a per-project lint script (missing in exactly the repos you forget); blocking.

### 4.5. Ephemeral area

**D20.** `docs/scratch/` is kept but made mechanically ephemeral: files are named `YYYY-MM-DD-<slug>.md`, and a `SessionStart` hook deletes entries older than 28 days (two sprints) **and prints what it deleted**. Silent cleanup teaches nothing; seeing "deleted 4 stale scratch files" is the feedback loop that stops the dumping. Retention keys off the filename, never `mtime` -- a `git checkout` resets `mtime`, which is why every file in `explanation/` currently reads as recently touched.

## 5. Decision memory

**D21.** There is no separate "precedent ledger" -- **ADRs already are that object.** Same schema, same purpose, same read pattern; `ADR-0022 custom design system over Bootstrap` is already a rejection record. Two locations, one format:

- `dev0/install/adr/` -- cross-project precedent. _`static-server` accepted. Conventional commits rejected. React, Zod rejected._ Binds everything. Installed like any other category.
- `<project>/docs/adr/` -- this codebase. Supersedes a global ADR when it says so explicitly. The toolkit's own decisions (two-phase install, plain symlinks) live in `dev0/docs/adr/` by the same convention.

_Revised 2026-09-13:_ the two locations stay separate because one is installed and the other is not. _Rejected:_ a single `docs/adr/` with scope front matter (the installer would filter by scope -- a per-category special case); renaming `traits/` to `src/` (`lib/` and `bin/` are the source; the folder is content -- its actual rename is D65).

**D64 -- How agents reach cross-project ADRs.** _Added 2026-09-13._ `install/adr/` symlinks to `~/.claude/adr/` like any category. A **generated** one-line-per-ADR index (`~/.claude/adr/README.md`, rebuilt from ADR titles by `dev0 install` or lint, never by hand) is named in two places: one line in `philosophy.md` -- "before a dependency or architecture choice, read the ADR index" -- and the dependency gate's refusal message. The pointer covers architecture choices no hook can see; the hook covers the moment the pointer is most likely skipped. The always-on cost is one line, regardless of ADR count.

_Rejected:_ the index inlined in `philosophy.md` (grows with every ADR); a hand-maintained index (drifts); a pointer alone or the hook alone.

**D22.** The real distinction is **decision versus rule**: _"we rejected Zod"_ is an ADR and **justifies**; _"validate at the boundary, then trust"_ is a rule and **instructs**. Some ADRs produce a rule; most do not.

**D23.** ADRs are capped at roughly 200 lines. `ADR-0011` is 42 KB -- a design document wearing an ADR's clothes, unreadable at the moment of decision, which is the only moment it exists for. Long-form material becomes a linked asset. `platform` also has two ADR homes, two naming conventions, and a gap at `ADR-0016`–`0019` to reconcile (D62).

Linked long-form assets live in the tracker's paired wiki (D61). An ADR must make complete sense without its link: the link is depth, never a dependency, so a dead wiki link -- or lost Confluence access -- never costs the decision.

**D62 -- The ADR format is Pocock's.** _Added 2026-09-13._ `domain-modeling/ADR-FORMAT.md`: `# Title`, then 1-3 sentences of context, decision and why; Status, Considered Options and Consequences are optional; files are `NNNN-slug.md`; an ADR is offered only when the decision is hard to reverse, surprising without context, and a real trade-off. One layer-above rule: ADRs in `install/adr/` **must** list what was rejected, since rejection is why a precedent exists; Status is **required** where a project ADR supersedes a global one (D21). `platform` converts to `NNNN-slug.md` during the Phase 6 harvest.

_Rejected:_ our own Nygard-style template (conflicts with what `domain-modeling` writes); Pocock's format with no rejection rule (loses the load-bearing part, §1).

## 6. The three tiers

**D24.** Everything in the framework sits in exactly one tier, named by verb:

| Tier             | Verb     | Where                        | Load                                                    |
| ---------------- | -------- | ---------------------------- | ------------------------------------------------------- |
| **Rules**        | instruct | `philosophy.md`              | always                                                  |
| **ADRs**         | justify  | `install/adr/` + `docs/adr/` | pointer, fires on a dependency or architecture decision |
| **Hooks + lint** | enforce  | `settings.json`, `oxlint`    | on the tool call                                        |

A rule only earns tier 1 if it beats the model's default _and_ cannot be mechanised. Anything mechanisable drops to tier 3, because instruction decays over a long session and a hook does not.

Bootstrapping a new project with the standard folders and npm scripts: D68.

## 7. The global layer

Today `~/.claude/CLAUDE.md` is one line, while `~/.claude/rules/*.md` injects **4.6k tokens into every session** -- `javascript.md` (6.3 KB) while you write CloudFormation, `markdown.md` while you debug auth.

**D25.** Demote by relevance. Target: global always-on under **~1,200 tokens**.

| File            | Now    | Becomes                                                          |
| --------------- | ------ | ---------------------------------------------------------------- |
| `philosophy.md` | always | **always** -- Dev0 proper: D1, the gates, code rules v1          |
| `code-style.md` | always | **always** -- 1 KB, naming and casing, applies to every language |
| `javascript.md` | always | **skill**, model-invoked on JS work, carrying `testing.md`       |
| `testing.md`    | always | merged into the `javascript` skill -- _revised 2026-09-13_       |
| `markdown.md`   | always | folded into the `markdown` skill                                 |
| `diataxis.md`   | always | **deleted** -- superseded by D11–D14                             |

The `testing.md` row was revised because `tdd` is upstream and cannot absorb anything (D52). `node:test`, Playwright and the test layout are JavaScript rules, so they travel with the `javascript` skill and fire with it; Pocock's `tdd` supplies the red-green-refactor process. PHP testing lives in the `php` skill (D60).

**D70 -- `tests/`, plural, everywhere**, like `docs/`. _Added 2026-09-13._ It matches `platform`, `legacy.web` and the monorepo rule in `testing.md` (workspace `tests/` for unit, functional and API tests; root `tests/` for end-to-end and cross-workspace tests). The toolkit's own `test/` is renamed in Phase 0.5. Node's automatic discovery of any file under `test/` adds nothing once `*.test.js` naming is required.

**D26.** The risk -- a skill that does not fire means JS written without your conventions -- is mitigated by a hook, not by hope (§9).

**D26a.** Phase 0 raised this decision's value sharply: subagents inherit the full rules set (§16, A2), so the 4.6k is paid **per agent**, not per session. A loop that spawns a worker per issue pays it every time.

**D71 -- ASCII punctuation in prose:** `--`, not an em dash; `...`, not an ellipsis character. _Added 2026-09-13._ Chosen for readability, typing and grep -- the token difference is negligible. Held in memory for now and mechanised by Markdown lint/format in Phase 7, never an always-on rules line.

The three layers then answer three different questions, and nothing restates the layer above it: **global = how I think and write. Project root = what this system is called. Cascade = how this corner works.**

## 8. The toolkit

_Added 2026-09-13._ The repo that began as `~/.claude` sync becomes the toolkit Dev0 is delivered through.

**D65 -- `capabilities` becomes `dev0`, the Dev0 toolkit.** The scope test: does it exist only to serve the Dev0 workflow? **In:** the philosophy (`DEV0.md`), agentic traits (skills, agents, rules, hooks, ADRs), worktree shell functions, project templates. **Out, to the dotfiles repo:** general shell and machine setup (prompt, aliases, PATH, editor). The repo and CLI are renamed `dev0` (`dev0 install`, `dev0 sync`, `dev0 status`); `traits/` becomes `install/`, which stays true of its contents however the categories change; `test/` becomes `tests/` (D70). `CLAUDE.md` ("What this is") and `architecture.md` §2 are rewritten; the trAIt link survives as history.

_Rejected:_ keeping the repo narrow (worktree functions named after tracker issues are Dev0 workflow, not general shell); merging dotfiles in; renaming `traits/` to `toolkit/` (a part named after the whole) or to `src/`; keeping the historical names.

**D66 -- Zero runtime dependencies.** `yaml`, imported once to parse a five-line file, is dropped: `capabilities.yaml` becomes `dev0.json`, read with `JSON.parse`. The config already maps each category to its install target, so new targets (`~/.oh-my-zsh/custom/plugins/dev0`, `~/bin/dev0`, `~/.claude/dev0/`) are entries, not code paths. `npm install` is needed only for dev tooling, never to use the toolkit.

_Rejected:_ keeping `yaml` as an accepted-dependency ADR (a Dev0 toolkit carrying a dependency it cannot justify is a bad first ADR); hand-rolling a YAML subset (the edge-case-heavy spec the `marked` example argues against re-implementing).

**D67 -- No `install.sh`.** Bootstrap is `git clone`, then `node bin/dev0 install`, which also links `bin/dev0` into `~/bin`. `bin/dev0` checks `process.versions` itself, so every command gets the Node check, not just the first install. The trigger to add a script is a need Node cannot meet, such as installing Node itself -- not before (D4).

_Rejected:_ a POSIX `install.sh` (a second entry point to keep in step); both.

**D68 -- `dev0 new <name>` copies a template.** `install/templates/js/` holds a `CLAUDE.md` with the tracker and wiki declaration block, an `AGENTS.md` symlink, `docs/{adr,runbooks,reference,scratch}/`, `tests/`, a `package.json` with `lint`, `format`, `typecheck` and `test` scripts, `.oxfmtrc.json`, `.oxlintrc.json`, `jsconfig.json`, and a tracker `.mcp.json` (D69). It is copied verbatim, with no generator: the template is the documentation of what a Dev0 project looks like. Built in **Phase 2**, because the completion gate (D29) fails in any repo without those scripts. A PHP template is added when a new PHP project appears; `legacy.web` already exists.

_Rejected:_ a generator; prompting for a language; deferring to Phase 7.

## 9. Enforcement

**D27.** Hooks live in a new `install/hooks/` symlink category -- same plain-symlink model as `skills`/`agents`/`rules`, no per-category code path. _Revised 2026-09-13:_ shell ergonomics (worktree functions) also live in the toolkit, as `install/shell/` (D55), not in the dotfiles repo -- see D65.

**D28.** `~/.claude/settings.json` is currently unsynced and carries machine-local content (`autoMode` environment, project permissions). `install/settings/hooks.json` becomes the synced source of truth for hook wiring, **merged** into `settings.json` by `dev0 install`. This is the one place a symlink is not enough.

**D29.** The inventory:

| Hook                                 | Event                                                                                                   | Does                                                                                      | Blocking                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Dependency gate**                  | `PreToolUse` on `Bash(npm install\|npm i\|yarn add\|pnpm add)` with a package named, `-D` included (D3) | refuses; names the ADR index (D64) or says ask                                            | **BLOCK**                                         |
| **Git absolutes**                    | `PreToolUse` on `Bash(git push --force*\|git merge*\|git switch main\|git checkout main)`               | refuses                                                                                   | **BLOCK**                                         |
| **Format and lint on write**         | `PostToolUse` on `Edit\|Write` of `*.js`                                                                | `oxfmt` + `oxlint` on the **changed file only**                                           | feeds errors back                                 |
| **Completion gate**                  | `Stop`                                                                                                  | `npm run lint && npm run typecheck && npm test`                                           | **BLOCK**, ceiling of two retries then report red |
| **Scratch retention**                | `SessionStart`                                                                                          | delete `docs/scratch/` entries >28 days, print what went                                  | advisory                                          |
| **Micro-module check**               | `Stop` or CI                                                                                            | single export, under N lines, exactly one importer → flag for inlining                    | warn                                              |
| **Root budget**                      | `PostToolUse` on `Edit\|Write` of `CLAUDE.md`, `CONTEXT-MAP.md`, `CONTEXT.md`                           | measure root `CLAUDE.md` plus imports against 6 KB (D63)                                  | warn                                              |
| **PHP format and lint** _(Phase 2b)_ | `PostToolUse` on `Edit\|Write` of `*.php`                                                               | `php-cs-fixer` and `php -l` inside `php:<production>-cli`, on the changed file only (D60) | feeds errors back                                 |

**D30.** The **dependency gate is the most important artefact in the design.** D3 settled on default-deny, and we both knew the prose version is something a model talks past. A `PreToolUse` hook cannot be talked past. That single hook converts Dev0 from a philosophy into a property of the machine. It is **global**, not opt-in: a Dev0 rule that is off in new repos is off exactly where dependencies get added.

**D31.** The completion gate is the `/harness` idea done correctly. `platform`'s root `AGENTS.md` has instructed self-verification for months against a skill that cannot resolve. A `Stop` hook runs whether or not the agent remembers. `verify.js` is redundant and deleted -- `npm run lint`, `typecheck` and `test` already exist and are better.

**D32.** Hooks fire on the **tool call**, so they apply regardless of which context window issued it. This is the strongest argument for putting Dev0's teeth in hooks rather than prose: hooks do not care whether a subagent inherited your rules.

## 10. Trackers

Three live backends: **Jira** (client work), **Paca** (6 personal projects), **Azure DevOps Boards** (legacy personal projects).

**D33.** Tracker is declared **per project**, no pattern by project type. The declaration lives in the project root `CLAUDE.md` -- roughly five lines, relevant every session, and exactly the payload the root file is reserved for.

**D34.** One `tracker` skill defines the **contract** -- _next, get, comment, transition, create_ -- and carries a recipe per backend. No adapter library, no dependency: the skill _is_ the adapter. `to-issues`/`to-tickets` already resolve the tracker through a pointer rather than naming one, so this formalises an indirection that exists.

**D35.** Branch naming stays `<key>-<slug>` (lowercase), e.g. `proj-1419-example-slug`. Worktrees take the same name; multiple worktrees for one issue suffix a lowercase sluggified task. PR title is `{Issue Title} (Re: {KEY})` with the key uppercase.

_Rejected:_ Paca's documented auto-link pattern `<type>/<PREFIX>-<number>-slug` -- because **conventional commits are deliberately rejected** (now a global ADR). Consequence: Paca's webhook auto-linker will not match, so the Paca recipe calls `github_link_pr_to_task` explicitly **and asserts the link exists afterwards** via `github_list_task_prs`. A forgotten compensating step fails silently, which is the worst failure class; an asserted one does not.

**D36 -- The 14 `paca-*` commands are deleted.** _Revised 2026-09-13; the original fixed their missing frontmatter._ They are loose, unsynced files in `~/.claude/commands/` left by Paca's setup, listed in every session including client work, and only `paca`, `paca-epic` and `paca-setup` were ever run (1-2 times each). A tracker's MCP server supplies the tools; the `tracker` skill's Paca recipe (D34) supplies the procedure. Anything worth keeping from `paca-epic` moves into the recipe first.

_Rejected:_ keeping the three used commands, synced via `install/`; per-project copies (14 files in each of 6+ repos).

**D69 -- Tracker MCP servers are configured per project.** _Added 2026-09-13._ Each project declares its tracker server in a committed `.mcp.json`, beside the tracker declaration in its root `CLAUDE.md` (D33): versioned together so they cannot drift, and a clone brings both. Credentials come from environment variables, never the file. The global `paca` entry in `~/.claude.json` is removed. MCP tool definitions are context just as skill pointers are, so this is D54 applied to MCP.

_Rejected:_ per-project entries in the local `~/.claude.json` (unsynced; set up by hand on every machine); keeping `paca` global.

## 11. The autonomous loop

**D37 -- Eligibility gate.** All must hold: labelled **AFK**; **unblocked**; **assigned to an authorised agent**; in the active sprint or Ready status; **carries an approved spec**.

**D38 -- Assignment is the sign-off.** Assigning `PROJ-1419` to `claude-dev` means "spec approved, go". One gesture, no separate approval label or status dance -- and an explicit act is a stronger gate than the absence of an assignee.

**D39 -- Spec, not acceptance criteria, drives construction.** AC is a _test oracle_; it tells you whether you are done. It is not a build instruction. Given only AC an agent must invent the spec, and its invention is not yours -- which is why the results have been abysmal. So:

| Artefact | Answers          | Drives              | Author                                   |
| -------- | ---------------- | ------------------- | ---------------------------------------- |
| **Spec** | what do I build? | construction        | `grilling` → `to-spec`, **you sign off** |
| **AC**   | is it done?      | verification, tests | you                                      |

**D40.** The tracker schema gets **one markdown field, `spec`** -- not a nine-field template. A structured schema would have to be replicated across Jira, Paca and ADO; one field does not. The structure lives inside `to-spec`, where it evolves without touching three trackers.

**D41 -- Ordering is the tracker's, not the agent's.** Sprint order, then priority. An agent choosing _what_ to work on is making a decision you want to make; choosing _how_ to do the top item is not.

**D42 -- Failing the gate is loud.** An ineligible issue gets a comment naming the condition it failed, then the loop moves on. Not a silent skip -- the comment is what teaches you to write loopable issues.

**D43 -- The worker can refuse.** If the spec does not close a decision it needs, the Sonnet worker stops, comments which decision is missing, unassigns itself and moves on. This converts underspecification into feedback on your specs rather than into code you will strip.

**D44 -- Autonomy boundary: branch, push, open a PR. Never merges.** In a git worktree. Three absolutes: never `main`, never force-push, never merge.

_Rejected:_ proposal-only and commit-locally (a pile of unpushed diffs is a review queue whose context you must reconstruct -- worse than doing it yourself); merge-on-green (the failure mode is not bad code, it is **correct code for a misunderstood ticket**, and CI cannot see that; the PR is where you catch it cheaply).

**D45 -- Stop and wait for review after each PR**, with a countable graduation to full autonomy: **ten consecutive loop PRs merged with no material change by you.** Otherwise you either never flip the switch or flip it on a good day.

**D46.** The loop's real prerequisite is a well-sliced backlog, not clever automation -- reviewable PRs require tracer-bullet issue sizing, which lands back on `to-issues`.

## 12. Agents and models

**D47.** An agent's only real distinction from a skill is its **own context window**:

> **An agent earns its place when you want the work done without its byproducts in your context.** Otherwise it is a skill.

Most existing agents are 890–3,800 byte "you are an expert X" personas -- largely no-ops, since the model is already an expert -- whose behaviour-changing content duplicates existing skills.

**D48 -- The cull:**

| Agent                        | Verdict                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SeniorDev`                  | delete -- `philosophy.md` wearing a persona, and the persona is _you_, deployed on the wrong side of D1. Its PHP doctrine seeds the `php` skill first (D60)                                                                                                                                                                                     |
| `cqrs-api-architect`         | delete the agent; DDD/CQRS content merges into a skill, Dev0 lines into `philosophy.md`                                                                                                                                                                                                                                                         |
| `doc-agent`                  | delete -- docs are now thin and issue-triggered                                                                                                                                                                                                                                                                                                 |
| `iac-agent`                  | delete -- duplicates the `cloudformation` skill                                                                                                                                                                                                                                                                                                 |
| `slides-agent`               | **keep** -- unique output format, and deck generation is exactly the noisy work you do not want in your window                                                                                                                                                                                                                                  |
| **loop worker** _(new)_      | one issue, own context, returns a PR                                                                                                                                                                                                                                                                                                            |
| **Dev0 review pass** _(new)_ | reads the diff, returns findings -- the edit you currently make by hand. The only agent that sees the tenets (D59): `DEV0.md` is symlinked to `~/.claude/dev0/DEV0.md` and the agent is told to read it first. When built, test whether `@` imports work in agent files (undocumented) and switch to an import if they do. _Revised 2026-09-13_ |

**D49 -- Model per agent** via `model:` frontmatter. The axis is not task complexity but **has the spec already closed the decisions?**

| Work                                               | Judgement or compliance                   | Model           |
| -------------------------------------------------- | ----------------------------------------- | --------------- |
| Spec, architecture, grilling                       | judgement; extrapolation wanted           | **you + Opus**  |
| Loop worker executing an approved spec             | compliance; **extrapolation is a defect** | **Sonnet**      |
| Dev0 review pass -- "does this look like my code?" | judgement; requires taste                 | **Opus**        |
| Bug diagnosis                                      | judgement; open-ended                     | **Opus**        |
| `slides-agent`, research, explore                  | format compliance, retrieval              | Sonnet or Haiku |

Opus reading more into the solution is the feature upstream and the defect downstream. Sonnet on the worker also makes unattended running affordable.

**D50 -- There is no Opus worker.** Work needing senior judgement routes to **you**, not to a better model improvising architecture inside the loop -- which is the failure mode that produced the abysmal results in the first place. The Opus slot is for judgement where you are _deliberately_ absent: reviewing a diff, diagnosing an opaque failure. Not building.

**D51 -- The Dev0 review pass is the highest-leverage artefact after the code rules.** You already perform it by hand. `/simplify` and Pocock's `code-review` exist but neither knows what _you_ strip. Unlike a rule, it runs after generation, when the verbosity actually exists to be seen.

## 13. Skills, plugins and context budget

The skill roster is now the **largest always-on cost** in the setup -- larger than the `rules/` problem that started the session.

|                                   |                                          |
| --------------------------------- | ---------------------------------------- |
| Your 29 skills, descriptions only | **11.9 KB ≈ 3,000 tokens** every session |
| `rules/*.md` (being cut)          | 4.6k tokens                              |
| Three enabled plugins             | roughly 50 further pointers              |

**D52 -- Never fork upstream. Customise in the layer above.** Upstream skills stay pristine so improvements flow; your preferences live in `philosophy.md` and the `CLAUDE.md` cascade. The current forks were taken from an older version of Pocock's repo and hand-edited, which silently cut off upstream improvements.

**D53 -- Collisions resolved in Pocock's favour:**

| Collision                                      | Action                                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `grilling` -- yours 843 B, Pocock's 1,872 B    | delete yours (this very session ran the smaller, older fork)                           |
| `to-issues` (yours) vs `to-tickets` (Pocock)   | delete yours -- same job, different names, so nothing signalled they were alternatives |
| `tdd` -- yours 4,395 B, Pocock's 3,568 B       | lift your `node:test` additions into the `javascript` skill (D25), then adopt upstream |
| `arc42-architecture`, `diataxis-documentation` | delete -- retired by D12–D14                                                           |

Duplicate pointers to one capability are a variance bug: the model picks arbitrarily per session, so behaviour silently differs run to run.

**D54 -- Plugins are enabled per project.** `paca` is irrelevant on client work; `claude-mem` is irrelevant on one-off client repos. The cascade principle applied to plugins.

## 14. Worktree ergonomics

**D55.** Hard constraint that decides the shape: **a git alias cannot `cd`** -- aliases run in a subprocess, and neither can a `dev0` subcommand. It must be a **zsh function**, sourced into your shell.

_Revised 2026-09-13:_ shipped as an **oh-my-zsh plugin**. `install/shell/` holds `dev0.plugin.zsh` and `_gsw` (branch and worktree completion), linked to `~/.oh-my-zsh/custom/plugins/dev0` by `dev0 install` and enabled once by adding `dev0` to `plugins=(...)` in `.zshrc`. oh-my-zsh adds the plugin directory to `fpath` before `compinit`, so completion needs no workaround; the file is plain zsh, so a machine without oh-my-zsh can `source` it directly.

_Rejected:_ a `$ZSH_CUSTOM/*.zsh` file (auto-sourced, but after `compinit`, so completion needs a `compdef` workaround); a fixed `~/.config/dev0/dev0.zsh` sourced from `.zshrc`; bash-completion (loads on first tab, too late to define a function).

Roughly 30 lines, zero dependencies:

```zsh
gsw <branch>   # worktree exists → cd to it; otherwise git switch in place
gwt            # list worktrees by branch, not by UUID
gwtprune       # remove worktrees whose branch is merged or gone
```

**D56.** The loop names its own worktrees after the issue (D35), so directory, branch and ticket agree and most of the pain never occurs. The current pain is visible in one line: the directory is `agent-aefa27ba77fbb9efe`, the branch is `proj-1419-example-slug`. `git worktree list` already maps one to the other; only the ergonomics were missing.

## 15. Build order

**D57.** Ordered by compounding value per unit of effort.

| Phase   | What                                                                                                                                                                                                                                                                   | Why here                                                                                                                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **0**   | Settle the two unverified assumptions (§16)                                                                                                                                                                                                                            | Blocks 1 and 5. Minutes.                                                                                                                                                                               |
| **0.5** | **Restructure** -- rename to `dev0` (repo, CLI, Paca project), `traits/` to `install/`, `test/` to `tests/`; `capabilities.yaml` to `dev0.json`, dropping `yaml`; self-linking `bin` (D65-D67, D70)                                                                    | Mechanical, and covered by the existing suite, which spawns the CLI through a symlink. Cheapest now: everything after is written once, at its final paths.                                             |
| **1**   | **Dev0 core** -- rewrite `philosophy.md` (D1, gates, code rules v1, ADR pointer); write `DEV0.md` (D59); create `install/adr/` with the known entries and generated index (D62, D64); demote `rules/` per D25 into the `javascript` skill; write the `php` skill (D60) | **No code, pure content.** The only phase that compounds into its own construction: it improves every session that builds the later phases. The `php` skill rides here because SSO work is active now. |
| **2**   | **Enforcement** -- `install/hooks/` category, settings-fragment merge, the D29 hooks for `.js`, root-budget warning (D63); `install/shell/` plugin (D55); `dev0 new` with `install/templates/js/` (D68)                                                                | Dev0 stops being advice. Prerequisite for unattended running. The completion gate needs the templated scripts to exist.                                                                                |
| **2b**  | **PHP enforcement** -- `php-cs-fixer`, `php:<production>-cli` lint, PHPUnit in the completion gate (D60)                                                                                                                                                               | Same pattern as Phase 2, proven on JS first.                                                                                                                                                           |
| **3**   | **Hygiene** -- skill cull, agent cull, delete `paca-*` (D36), tracker MCP per project (D69)                                                                                                                                                                            | Pure context-load reduction; independent, so it can slot anywhere, but earlier means cheaper sessions thereafter.                                                                                      |
| **4**   | **Tracker contract** -- `tracker` skill, per-project declaration                                                                                                                                                                                                       | Loop prerequisite.                                                                                                                                                                                     |
| **5**   | **The loop** -- Sonnet worker, named worktree, stop-and-wait, refuse-on-thin-spec                                                                                                                                                                                      | First real test.                                                                                                                                                                                       |
| **6**   | **Client docs harvest** -- 2.3 MB of `explanation/` into the cascade and ADRs                                                                                                                                                                                          | Biggest chunk, and the loop can help do it.                                                                                                                                                            |
| **7**   | Backfill remaining languages, remaining trackers, Markdown lint including ASCII punctuation (D71); graduate autonomy at ten clean PRs                                                                                                                                  | --                                                                                                                                                                                                     |

**D58 -- First loop target is `dev0` itself**, tracked in **Paca**. Small, every decision is yours, its issues are literally "build this framework", and a failure costs nothing. Paca has the best API of the three backends -- PR creation, task linking and CI status in one plugin. `issues.md` migrates into a Paca project named **`dev0`** from the start (D65).

## 16. Phase 0 -- unverified assumptions

Both tested 2026-09-11. **Both resolved in the design's favour.**

**A1 -- Does the `CLAUDE.md` cascade load intermediate directories? YES.**

Method: a sentinel-tagged fixture (`CLAUDE.md` at root, `a/`, and `a/b/`, each carrying a unique marker) probed by a fresh non-interactive session that was forbidden from opening any `CLAUDE.md`.

```text
BEFORE (session start, no file read):  SENTINEL-ROOT-7Q
AFTER  (Read a/b/target.js):           SENTINEL-ROOT-7Q, SENTINEL-MID-4K, SENTINEL-DEEP-9Z
```

Two facts, both load-bearing:

- **Only the root is always loaded.** Nested files cost nothing until their subtree is touched -- the on-demand claim behind D15 holds, and root-file size discipline is the only always-on budget that matters.
- **Touching a deep file pulls every `CLAUDE.md` along the path**, intermediate directories included. So `workspaces/CLAUDE.md` loads when `workspaces/iam/lib/foo.js` is read. **D15 and D16 stand as written** -- the HLA at `workspaces/` reaches every workspace session and no other.

**A2 -- Do subagents inherit the cascade and `philosophy.md`? YES -- fully.**

A fresh `general-purpose` subagent, told to use no tools and report only what it could already see, returned the global `~/.claude/CLAUDE.md`, the project `CLAUDE.md`, **and all six `traits/rules/*.md` files**, quoting each verbatim and naming its path.

Consequences:

- The Sonnet loop worker **will** receive the Dev0 code rules. The leak D32 was hedging against does not exist, and the Q18 fallbacks -- restating rules per agent, or having agents read `philosophy.md` as a first step -- are both unnecessary. D32's argument still holds on its own merits, since hooks fire on the tool call regardless of context.
- **But the cost multiplies.** Every subagent pays the full always-on load. The probe above burned **52,624 tokens answering a single zero-tool question** -- mostly the harness baseline (system prompt, tool definitions), which no framework decision can shrink. `rules/` is **~4.6k of that**, and it is the part we control. The loop spawns one worker per issue, so that 4.6k is not a per-session cost but a per-_agent_ cost. This sharpens D25 from housekeeping into the highest-value token decision in the plan.
- `diataxis.md` is therefore currently injected into every subagent on every project -- while being the one rules file D25 deletes outright.

## 17. Where this document goes next

On confirmation, content disperses and this file is allowed to die.

| Content                                 | Home                                    | Lifetime                                     |
| --------------------------------------- | --------------------------------------- | -------------------------------------------- |
| Code rules v1, judgement gates, D1      | `install/rules/philosophy.md`           | durable, always-on                           |
| Introduction, tenets, decision matrix   | `DEV0.md` at the toolkit root           | durable, human-facing (and the review agent) |
| Cross-project decisions plus rejections | `install/adr/`                          | durable, pointered                           |
| Toolkit decisions plus rejections       | `dev0/docs/adr/`                        | durable                                      |
| The ownership rule and the cascade      | `dev0/CLAUDE.md` and the rules layer    | durable                                      |
| The phases                              | **Paca issues**, `dev0` project         | until done                                   |
| Per-phase implementation detail         | `to-spec` into the issue's `spec` field | throwaway                                    |

That last row means **phase 1 dogfoods the spec field immediately** -- the part of this design most worth testing early, since it is where agents have failed you worst.

[← Back to Documentation Home](../README.md)

# Dev0: Spend Your Judgement Before the Code Exists <!-- omit in toc -->

If you have used a coding agent seriously, you know this moment. The agent finishes. The tests pass. You open the diff and start deleting.

A defensive null check on an argument the type system already guarantees. A `try`/`catch` that logs and rethrows, stripping the stack context on the way. A `utils/` folder holding one function with one caller. A JSDoc block that restates the function name in a full sentence. A constant named `MAX_RETRIES_THREE` set to `3`. And, somewhere in `package.json`, a validation library pulled in to check two fields.

None of it is wrong, exactly. It compiles, it runs, it would pass most code reviews. It just is not the code an experienced engineer would have written, and you spend your afternoon turning it into that code, one file at a time, on every pull request, forever.

I have been building software for 40 years. Dev0 is my attempt to name how I do it, and then to rebuild my agentic workflow so that the machine does it that way too. This post explains what Dev0 is, why it produces better software than the framework-first defaults most of us grew up on, and why it puts the senior engineer in a more valuable position in an agentic world, not a less valuable one.

## The zero in Dev0

Dev0 stands for **Zero-Based Development**. The name borrows from zero-based budgeting, where a department does not start from last year's budget plus 5%; it starts from nothing, and every line item has to justify itself.

Most of us build software the opposite way. `npx create-next-app`, `laravel new`, `express-generator`. We start from a framework, a folder structure, a state library, an ORM, a validation library and a few hundred transitive packages, and then we write our actual problem into the gaps. The posture is "why _shouldn't_ we add this?"

Dev0 inverts the question: **does this component earn the right to exist in our system?** Start from zero assumptions, zero abstractions and zero dependencies, and make every addition justify itself against the whole.

That is not code golf, and it is not asceticism. The tenets are practical:

- **Architecture begins at the perimeter.** Before any code, look wide: what are the business domains, and where are the boundaries between them? If you come from microservices, this will feel familiar, except the boundaries are drawn by business meaning rather than by deployment units. Domain-Driven Design calls these _bounded contexts_: areas of the business where a word like "Account" means one precise thing. The same instinct is why I favour intent-based, CQRS-style APIs, where commands that change state ("register producer") are modelled separately from queries that read it, over a generic REST resource that tries to be both.
- **Zoom deliberately.** The [C4 model](https://c4model.com/) (Context, Containers, Components, Code) is the zoom lens. It keeps you from hyper-optimising a leaf component at the expense of the container around it.
- **Dependencies are evaluated, not forbidden.** Dev0 does not ban third-party packages. It bans _unexamined_ ones. Weigh the business value against the total footprint.
- **You own the whole tree.** A 5 KB utility that drags in 40 transitive packages, a cyclic dependency or a build toolchain fails the test. You are accountable for everything `npm install` put on disk, not just the line you typed.
- **The platform is the default framework.** Browser APIs, the runtime's standard library, HTTP, semantic HTML, CSS Grid. Reach for them first; layer abstractions only when they fall short.

Three examples from a Markdown slide-deck engine I built make the matrix concrete:

- **Justified:** parsing CommonMark. The spec is full of edge cases and sanitisation traps. A single focused, battle-tested library like `marked` is the right call: the problem is solved and specialised, and its footprint is bounded.
- **Rejected:** a UI component framework and a state library to render a slide and toggle a modal. The platform already has semantic elements, Scroll Snap and the DOM, at zero runtime weight.
- **The structure is the interface:** slide boundaries are plain `<h1>` headings, not a custom metadata syntax. The deck stays valid Markdown in any renderer, with no parser to maintain.

## Why agents do not write Dev0 code

Here is the uncomfortable part. A coding agent is trained on the public corpus of software, and the public corpus is overwhelmingly framework-first, defensive, over-abstracted and dependency-happy. Ask for "a small API endpoint" and you get the statistical centre of every tutorial ever written. It is a very good median engineer.

For years my response was the one I described at the top: generate, then edit. And that is where Dev0 as a _toolkit_ started, with one observation:

> I was spending my judgement **after** generation, stripping verbose code out of diffs -- repeatedly, per file. The fix is to spend it **before** generation: once, on prose, answering questions rather than authoring. A spec constrains every file the agent touches. A post-hoc edit fixes one.

Everything else in the design is downstream of that sentence.

## The boundary: who owns what

The toolkit rests on one line. It is the first thing every agent reads:

> **You own spec and architecture. Agents own construction and verification. The signed spec is the boundary.**

Upstream of the boundary is human-in-the-loop work, and its whole purpose is to sharpen human thinking. An agent grills me about a plan, one question at a time, until the decisions are closed. It helps me model the domain and name things. It drafts a spec from our conversation. I sign it.

Downstream of the boundary is away-from-keyboard work, and its purpose is to execute _without interpreting_. The agent builds against the signed spec, then verifies against the code rules, the linters, the type checker and the tests.

The part that matters is where the expertise is spent. On the upstream side it is spent on the questions that actually determine quality: what are the boundaries, what are we not building, which dependency do we refuse, what happens at the edge. On the downstream side it is barely spent at all, because those questions have already been answered.

### A spec is not acceptance criteria

This distinction explained most of my bad results with autonomous agents.

Acceptance criteria are a **test oracle**. They tell you whether you are done. They do not tell you what to build. Hand an agent only acceptance criteria and it has to invent the design, and its invention is not yours. It will be plausible, and it will be the median.

| Artefact                | Answers          | Drives              | Author                     |
| ----------------------- | ---------------- | ------------------- | -------------------------- |
| **Spec**                | What do I build? | Construction        | Human, with agent grilling |
| **Acceptance criteria** | Is it done?      | Verification, tests | Human                      |

So every issue carries a `spec` field, and an agent does not pick up an issue without an approved one. Assigning the issue to the agent _is_ the approval. One deliberate gesture, no status dance.

### The worker is allowed to refuse

If the spec does not close a decision the worker needs, the worker does not guess. It stops, comments on the issue naming the missing decision, unassigns itself and moves on.

That sounds like a small feature. It is the most important behavioural change in the loop. Underspecification stops becoming code I have to strip and starts becoming feedback on how I write specs. The loop trains the human, not just the other way round.

## Instruct, justify, enforce

Anyone who has written a long `CLAUDE.md` or system prompt knows that instructions decay. Early in a session the agent follows them. Forty tool calls later, under pressure to make a test pass, "prefer no new dependencies" becomes "this dependency is clearly justified because...".

Dev0 puts everything in exactly one of three tiers, named by verb:

| Tier                 | Verb     | Example                                              | When it applies                      |
| -------------------- | -------- | ---------------------------------------------------- | ------------------------------------ |
| **Rules**            | Instruct | "Validate at the boundary, then trust."              | Always in context                    |
| **Decision records** | Justify  | "We rejected React for this, and here is why."       | Read when a relevant choice comes up |
| **Hooks and lint**   | Enforce  | A pre-tool hook that refuses `npm install <package>` | On the tool call itself              |

A rule only earns a place in the always-on tier if it beats the model's default _and_ cannot be mechanised. Anything that can be mechanised moves down to enforcement, because a hook does not decay.

The best example is the dependency gate. The rule is **default-deny**: no new dependency, runtime or dev, without the architect's decision, and no agent-side justification is accepted. As prose, that is something a model talks its way past. As a hook that intercepts the install command before it runs, it cannot be argued with. That single hook turns Dev0 from a philosophy into a property of the machine. It also fires regardless of which agent or subagent issued the command, so there is no leakage through delegation.

The same logic gives a completion gate: when the agent says it is finished, lint, type check and tests run whether or not the agent remembered to run them.

### Rules that can be counted

The rules that do stay in prose are written to be checkable. Two principles make that work.

First, **counted triggers**. "Avoid premature abstraction" is unfalsifiable. "Abstract on the third repetition, not the second" is not; an agent can be told it is wrong. The same shape recurs: a function lives in the file that calls it until a second caller exists; five or more parameters take an options object; a literal gets a name when it is used twice or the name adds meaning. Default to the direct thing, and earn the indirection with a trigger you can count.

Second, **positive phrasing**. "Don't write defensive null checks" puts defensive null checks into context and makes them more likely. "Validate at the boundary, then trust" describes the behaviour you want instead.

### Recording what you said no to

A codebase records what you built. It can never record what you ruled out. An agent that sees no React in the repository cannot tell whether React was rejected or simply has not been added yet, so it proposes React. Every session. Forever.

So Dev0 treats Architecture Decision Records as the precedent ledger, and every cross-project decision must list the rejected alternatives. "Validation library rejected" and "conventional commits rejected" are as load-bearing as anything accepted. Agents reach them through a generated one-line index, and the dependency gate's refusal message points straight at it.

## The right model in the right seat

A common instinct is "use the smartest model for everything". Dev0 routes models by a different axis: **has the spec already closed the decisions?**

| Work                                              | Nature                                    | Who                                 |
| ------------------------------------------------- | ----------------------------------------- | ----------------------------------- |
| Spec, architecture, grilling                      | Judgement; extrapolation wanted           | The human, with the strongest model |
| Worker building an approved spec                  | Compliance; **extrapolation is a defect** | A faster, cheaper model             |
| Reviewing a diff: "does this look like our code?" | Judgement; requires taste                 | The strongest model                 |
| Diagnosing an opaque bug                          | Open-ended judgement                      | The strongest model                 |

A highly capable model reading more into the problem is exactly what you want while designing, and exactly what you do not want while building against a signed spec. So there is deliberately no "senior" worker model. Work that needs senior judgement mid-build routes back to the human, not to a smarter model improvising architecture inside the loop. That improvisation was the failure mode in the first place.

The strongest model does get one construction-adjacent job: a review pass that reads the diff and does the stripping I used to do by hand. It is the only agent that reads the Dev0 tenets themselves, because judging whether a dependency or an abstraction earns its place is judgement. Workers get the rules; the reviewer gets the philosophy.

## Context is a budget, and documentation needs an owner

Every always-on instruction is paid for in every session, and every subagent inherits the full load. An autonomous loop that spawns one worker per issue pays it per worker. Context is a budget, and bloat in it has the same cost profile as bloat in a bundle.

That changed how I think about documentation. On one production platform I measured, half of the entire documentation mass sat in an "explanation" folder, and most of that described a part of the system that had no code of its own. Docs sprawl precisely where nothing owns them. Categorisation schemes tell you _which folder_ a fact belongs in; they never tell you "no, this already lives in the code".

Dev0's answer is an ownership rule: **knowledge lives beside the code it describes.** The directory tree is the information hierarchy. A short root file is always loaded; a file in `workspaces/` loads only when you work in a workspace; a file in `workspaces/iam/lib/` loads only when you touch that library. Depth equals specificity equals laziness of loading. Move the code and the documentation moves with it. If no code claims a piece of knowledge, it is either a decision record or it is dead.

And documentation is written when an issue asks for it or a public interface changes. Never speculatively.

## Autonomy is earned, and counted

The loop's autonomy boundary is narrow on purpose: work in an isolated worktree, branch, push, open a pull request. Never touch `main`, never force-push, **never merge**.

Why not merge on green? Because the dangerous failure is not bad code. CI catches bad code. The dangerous failure is **correct code for a misunderstood ticket**, and no test suite can see that. The pull request is where a human catches it cheaply.

After each PR the loop stops and waits for review. It graduates to running unattended after **ten consecutive PRs merged with no material change**. A countable threshold means you neither flip the switch on a good day nor never flip it at all.

## So, are we being replaced?

This is the question underneath every conversation I have with senior engineers right now, so let me answer it directly.

Agents are already very good at construction, and they will get better. If your value is translating a ticket into code, the ground under you is moving, and pretending otherwise does no one any favours.

But look at where Dev0 spends human expertise, and notice it is everything the agent is structurally bad at:

- **Drawing boundaries.** Which bounded contexts exist, what crosses between them, what "Account" means here.
- **Saying no.** Rejecting the dependency, the framework, the abstraction, the feature. The model is trained on a corpus of things people said yes to.
- **Closing decisions before they become code.** A spec that leaves nothing to extrapolate.
- **Recognising correct code for the wrong problem.** The failure no test can see.
- **Taste.** Knowing what your code should look like, well enough to write it down as rules an agent can be checked against.

None of those get cheaper when construction gets cheaper. They get _more_ valuable, because every unit of judgement now fans out across every file an agent writes instead of the files one person can type. An engineer with 20 years of hard-won opinions was previously limited by their own output. Encoded as a spec, a set of counted rules, a record of rejections and a handful of hooks, those opinions shape the output of as many workers as you can review.

The engineers most exposed are not the juniors or the seniors. They are the ones who let the agent make the architectural decisions by default. The lucky ones notice, and spend their days editing the median into shape. Many never notice at all. Blinded by the promise of AI, they accept the median as it lands, and their codebases quietly grow into tangled messes, carrying technical debt no one knows is there until it comes due. The first group has a tedious job Dev0 is designed to eliminate. The second has a crisis it is designed to prevent.

## What Dev0 is, honestly

A few caveats, because a framework post without them is marketing.

- **It is being built now**, in phases, and dogfooded on itself: the toolkit's own issues are the first work the autonomous loop will run against.
- **It is harness-specific.** The cascade, hooks and subagent behaviour lean on Claude Code's mechanisms, and I have accepted that trade-off in a recorded decision rather than building an abstraction layer across agents (which would itself fail the Dev0 test).
- **It is opinionated to one practitioner.** The code rules are literally derived from the edits I make to agent output. Yours will differ. The structure -- judgement upstream, compliance downstream, enforcement in hooks, rejections on the record -- is the part I expect to transfer.
- **It still runs on legacy code.** A large PHP monolith being strangled into a new platform gets Dev0 rules for the new interception code and a surgical-change rule for the legacy tree. Zero-based does not mean rewrite everything.

If you take one idea away, take the thesis. Stop spending your expertise stripping diffs after generation. Spend it before generation, once, where it constrains everything the agents build. The agents do the construction. You do the part that was always the hard part.

[← Back to README](./README.md)

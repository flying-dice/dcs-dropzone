---
id: GEN-002
title: Function Design Single Responsibility and Orchestration Layers
domain: general
rules: true
---

## Context

As codebases grow, undisciplined function design leads to tangled logic that is hard to test, trace, or reason about. The most common failure mode is the "god function" — a single function that reads configuration, transforms data, validates input, writes to disk, and decides what to do next, all in one body. These functions cannot be named clearly, tested in isolation, or reused.

This ADR establishes a classification system for functions based on three dimensions and forbids mixing concerns across those dimensions within a single function.

## Decision

Every function must be classifiable along three dimensions. A function that straddles multiple categories within a dimension is doing too much and must be split.

### Dimension 1 — Scope

**Leaf functions** perform one concrete operation. They do not compose other domain functions. They are the smallest unit of named, reusable work.

**Orchestration functions** compose leaf functions to express a complete use-case or workflow. Flow control (`if/else`, `switch`, early return, `.andThen()`/`.orElse()` chains) is allowed and expected here. Orchestration functions **must not call any runtime API directly** — no `fs`, `fetch`, `Bun.$`, `process.env`, `Date.now()`, `console`, `Math.random()`, etc. Every such call must be wrapped in a named leaf function first.

### Dimension 2 — Purity

**Pure functions** are deterministic and free of side effects. Given the same inputs, they always produce the same output and change nothing in the outside world. They are referentially transparent — you can replace the call with its return value and nothing changes.

**Effectful functions** interact with the world: reading or writing files, making network calls, reading environment variables, getting the current time, generating random values, or mutating shared state. Any function that depends on or changes something outside its arguments and return value is effectful.

Note: ambient reads (`getCurrentTimestamp()`, `getEnvVar(key)`) are effectful even though they look pure at the call site. Wrapping them in a named leaf function makes the effect visible.

### Dimension 3 — Direction

**Query functions** return data and change nothing. The caller uses the return value. Queries are safe to call speculatively, to cache, and to retry.

**Command functions** cause a change — write a file, send a request, mutate state. The return value, if any, is a confirmation or receipt, not the primary purpose of the call.

This follows Bertrand Meyer's Command-Query Separation (CQS) principle: a function should either return data or cause a change, not both.

### Function archetypes

These dimensions combine to produce a small set of named archetypes. Use these names as a shared vocabulary when discussing or reviewing function design.

| Archetype | Scope | Purity | Direction | Examples |
|---|---|---|---|---|
| **Transformer** | Leaf | Pure | Query | `formatIsoTimestamp(date)`, `normalizeWhitespace(str)` |
| **Builder** | Leaf | Pure | Query | `buildGitAuthorString(name, email)`, `buildCliArgs(options)` |
| **Validator** | Leaf | Pure | Query | `isValidEmail(str)`, `validateCommitMessage(msg)` |
| **Reader** | Leaf | Effectful | Query | `readConfigFile(path)`, `fetchUserProfile(id)` |
| **Writer** | Leaf | Effectful | Command | `writeCommitMessage(path, msg)`, `deleteTemporaryFiles(dir)` |
| **Ambient Read** | Leaf | Effectful | Query | `getCurrentTimestamp()`, `getEnvVar(key)`, `generateRequestId()` |
| **Orchestrator** | Orchestration | (inherited) | (inherited) | `runCommitWorkflow()`, `handleUserSwitch()` |

An orchestrator's purity and direction are inherited from the leaf functions it composes — it is effectful if any leaf it calls is effectful.

### The splitting rule

**If a function spans multiple archetypes, it must be split.** This is the core rule.

A function that reads a file, transforms the contents, validates the result, and writes it back is doing four things — reader, transformer, validator, writer. Extract each into a named leaf function and compose them in an orchestrator.

A function that reads `process.env` and also formats a string is mixing an ambient read with a transformer. Extract the env read into a named function so the formatting logic remains pure and testable.

The test: can you name the function with a single verb phrase that fully describes what it does? If not, it is doing too much.

### Naming conventions

- **Leaf functions** are named with a value-driven, descriptive verb phrase that fully describes the single thing they do. The name is the documentation. Examples: `readConfigFile`, `formatIsoTimestamp`, `buildGitAuthorString`.
- **Orchestration functions** are named to describe the workflow, not the implementation. Examples: `runCommitWorkflow`, `handleUserSwitch`.
- Never name functions after their implementation (`doStuff`, `processData`, `handleIt`).

### Error handling

See GEN-003 for the complete error handling decision. In summary: leaf functions that can fail return `Result` or `ResultAsync` (checked errors). Contract violations and impossible states use `throw` (unchecked errors). Orchestrators compose results using `.andThen()` chains.

## Do's and Don'ts

### Do

- Classify every function by scope, purity, and direction — if the classification is ambiguous, the function is doing too much.
- Name every function so its name alone tells a reader what value or effect it produces.
- Keep orchestration functions free of runtime calls — if you need `new Date()`, extract a `getCurrentTimestamp()` leaf function.
- Keep pure functions pure — no sneaking in `process.env` reads or `Date.now()` calls.
- Separate queries from commands — a function that reads a file and also deletes it should be two functions.

### Don't

- Don't write functions that span multiple archetypes — split them.
- Don't put runtime calls (`Bun.$`, `fetch`, `fs`, `process.env`, `Date`, `console`) inside an orchestration function body.
- Don't mix business logic and I/O in the same function — split into a leaf for the I/O and a separate leaf for the logic.
- Don't name functions after their implementation (`doStuff`, `processData`, `handleIt`).
- Don't add branching flow-control driven by business concerns inside leaf functions — only structural concerns such as mapping over a homogeneous list. Business branching belongs in orchestrators.

## Consequences

### Positive

- Functions are self-documenting; a call-site reads like a sentence.
- Orchestration functions become plain flowcharts of named steps, easy to audit or rewrite.
- Pure leaf functions are trivially unit-testable — no mocks, no setup, no teardown.
- Effectful leaf functions are easy to mock or stub because each wraps exactly one external interaction.
- The archetype vocabulary gives code reviewers a shared language for feedback.

### Negative

- More functions for operations that previously fit in a single body.
- Developers must learn the classification dimensions and archetype vocabulary.

### Risks

- Over-extraction: trivially simple expressions wrapped in named functions for the sake of the rule. Use judgment — a one-liner used once does not need wrapping unless it crosses a purity or direction boundary (e.g. an effectful call inside otherwise pure logic always needs extraction).

## Compliance and Enforcement

- This ADR is marked `rules: true`. The `archgate check` command flags violations during CI and in editor pre-commit hooks.
- PRs touching `src/` must confirm every new function is classifiable as a single archetype. If the classification is non-obvious, annotate it in JSDoc.

## References

- Gary Bernhardt, ["Boundaries" (SCNA 2012)](https://www.destroyallsoftware.com/talks/boundaries) — Functional Core, Imperative Shell pattern
- Bertrand Meyer, *Object-Oriented Software Construction* (1988) — Command-Query Separation
- Robert C. Martin, *Clean Code* (2008) — Single Responsibility Principle
- GEN-003 — Error Handling: Checked vs Unchecked Errors
- [Archgate CLI](https://github.com/archgate/cli)
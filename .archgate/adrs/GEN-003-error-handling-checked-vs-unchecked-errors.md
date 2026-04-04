---
id: GEN-003
title: Error Handling Checked vs Unchecked Errors
domain: general
rules: true
status: deprecated
superseded_by: GEN-005
---

> **⚠️ DEPRECATED:** This ADR has been superseded by [GEN-005 — Errors as Values Using Go-Style Tuples](./GEN-005-errors-as-values-go-style-tuples.md). New code must use the Go-style tuple pattern. The `throw` guidance for unchecked/contract errors in this ADR remains valid.

## Context

Not all errors are equal. Some represent bugs — conditions that should never occur in correct code and indicate a programming mistake. Others represent expected failure modes — conditions that callers must handle as part of normal operation (missing files, invalid user input, network timeouts).

Conflating these two categories produces code where callers cannot tell which failures are possible without reading the implementation, and where silent swallowing of exceptions is easy to do accidentally.

This ADR draws a hard line between the two categories and mandates the tools and conventions for each.

## Decision

### Choosing between `throw` and `Result`

The primary litmus test: **could a well-written caller do something meaningful with this error?** If yes, it is a checked error — return `Result`. If no, it is a bug — `throw`.

Use `throw` when the code has entered **bad state** — an assumption, guarantee, or invariant has been broken. Specifically, all of the following are true:

1. The condition is **not something expected to happen occasionally** (rate limits, missing files, malformed input are expected — use `Result`).
2. Code after this point **relies on not being in this bad state** — continuing would produce nonsense or be unsafe.
3. There is **no good way to encode the constraint in the type system** (if you can make the invalid state unrepresentable, do that instead — see [Validated Construction Types](#validated-construction-types)).

Use an errors-as-values pattern in all other cases where failure is a possibility a caller should handle.

When in doubt, default to returning the error as a value — it is always safe to give the caller the choice. Reserve `throw` for clear contract violations and impossible states.

### Unchecked Errors — use `throw`

Unchecked errors represent **contract violations**, **programming mistakes**, or **unrecoverable process-level failures**. The caller is not expected to handle them; they should crash loudly and surface a stack trace.

Functions have **contracts**: guaranteed behavior only when inputs meet documented requirements. Throwing on a contract violation signals a **caller-side bug** — the caller must fix their code, not catch the error. Document contracts (including throw conditions) in JSDoc.

Use `throw` (or allow a native exception to propagate) for:

- Violated invariants and assertions (`x should never be null here`)
- Unimplemented branches (`default: throw new Error("unreachable")`)
- Process bootstrap failures that make the application unrunnable
- Contract violations — caller passed values that break documented preconditions

These should extend `Error` so the stack trace is preserved:

```ts
class UnreachableError extends Error {
  constructor(value: never) {
    super(`Unreachable case: ${JSON.stringify(value)}`);
  }
}
```

### Checked Errors — return as values

Checked errors represent **expected, recoverable failure modes** that callers must explicitly handle. Return them as typed values using the Go-style tuple pattern defined in GEN-005.

Return errors as values for:

- I/O that can fail (file not found, network error, parse failure)
- Validation failures (invalid user input, schema mismatch)
- External service errors (API returning an error status)
- Any condition where the caller needs to branch on success vs failure

Returning the error as a value is the **good default** when defining a function that might fail — it gives calling code the option to decide recovery strategy for their context.

Every checked error type must extend `Error` so it is throwable at an integration boundary if needed and carries a stack trace:

```ts
class ConfigNotFoundError extends Error {
  constructor(public readonly path: string) {
    super(`Config file not found: ${path}`);
  }
}

// usage
async function readConfig(path: string): Promise<[Config, null] | [undefined, ConfigNotFoundError]> {
  const file = Bun.file(path);
  if (!(await file.exists())) return [undefined, new ConfigNotFoundError(path)];
  return [await file.json(), null];
}
```

### Consuming results

At the orchestration layer, destructure the tuple and use an early return to handle the error branch:

```ts
const [user, err] = findUserByAlias(users, alias);
if (err) { console.error(err.message); process.exit(1); }
// use user
```

### Error propagation and composition

Keep the happy path linear. Use early returns to propagate errors through a sequence of fallible operations:

```ts
async function loadApp(configPath: string) {
  const [config, configErr] = await readConfig(configPath);
  if (configErr) return [undefined, configErr] as const;

  const [schema, schemaErr] = validateSchema(config);
  if (schemaErr) return [undefined, schemaErr] as const;

  return buildApp(schema);
}
```

### Validated construction types

Instead of validating the same constraint at every call site, create types whose constructors enforce invariants so downstream code is **guaranteed** valid values. Parse the input once at the boundary; after that the type carries the proof.

```ts
class PortNumber {
  private constructor(public readonly value: number) {}

  static create(value: number): [PortNumber, null] | [undefined, InvalidPortError] {
    if (value < 1 || value > 65535) {
      return [undefined, new InvalidPortError(value)];
    }
    return [new PortNumber(value), null];
  }
}

// Downstream: accepts PortNumber, never needs to re-validate
async function listen(port: PortNumber): Promise<[Server, null] | [undefined, BindError]> { ... }
```

Key principles:

- Keep the inner value **private** — force all construction through the validated factory.
- The factory returns `Result`, making invalid input a checked error.
- Functions that accept the validated type **never need runtime checks** on that constraint — the constructor already did the work.
- Prefer narrower types over runtime assertions: `number` that is always positive → `PositiveInt`, a string that is always a valid email → `EmailAddress`.

### Wrapping third-party code

When a function wants to produce a typed tuple return for its callers, third-party throwing code at that boundary should be wrapped in `try/catch`:

```ts
function safeParse(raw: string): [unknown, null] | [undefined, JsonParseError] {
  try {
    return [JSON.parse(raw), null];
  } catch (e) {
    return [undefined, new JsonParseError(String(e))];
  }
}
```

### When `try/catch` is appropriate

The tuple pattern is a tool for the **producer** — a function that wants to type its error paths so callers can handle them. It is **not** a syntax replacement for `try/catch` at every call site.

If you are **calling** a function that throws and handling the error locally, a standard `try/catch` is preferred for clarity:

```ts
// ✅ Good — the called function throws, caller handles it simply
try {
  const parsed = WorkerToMain.parse(message);
  handler(parsed);
} catch (error) {
  logger.error("Failed to parse message from worker:", error);
}
```

## Do's and Don'ts

### Do

- Use `throw` for contract violations, programmer errors, and process-fatal conditions.
- Return errors as typed values (Go-style tuples) for any failure a caller must handle.
- Default to returning the error as a value when unsure — it is always safe to give the caller the choice.
- Extend `Error` for every custom error class — both checked and unchecked. The class name serves as the discriminant via `constructor.name`.
- Use `try/catch` to wrap third-party throwing code when your function wants to return a typed tuple to its callers.
- Use `try/catch` when **consuming** a throwing function that has not typed its errors — prefer clarity and familiarity.
- Co-locate error classes with the function that produces them.
- Use early `if (err) return` to keep the happy path linear when sequencing fallible operations.
- Create validated construction types to make invalid states unrepresentable.
- Document function contracts (including throw conditions) in JSDoc.

### Don't

- Don't catch and re-throw generic `unknown` errors — map them to a typed class immediately.
- Don't return `T | null` or `T | undefined` for operations that can fail — use typed error tuples.
- Don't return `boolean` for operations that can fail — return `[void, null] | [undefined, E]`.
- Don't use `T | undefined` when the **reason** for absence matters — return a typed error so the caller knows *why* it failed.
- Don't share error classes across unrelated domains.
- Don't use bare `Promise<T>` for async operations that can fail — return a typed error tuple inside the Promise.
- Don't replace a simple `try/catch` with a tuple wrapper when the called function has not typed its errors — the tuple pattern is for the **producer** to describe checked exceptions, not for the **caller** to add unnecessary syntax around untyped throwing code.

## Consequences

### Positive

- The type signature of every function declares exactly which failures the caller must handle.
- Unchecked errors still surface loudly with full stack traces.
- Error classes that extend `Error` can always be thrown at an integration boundary (e.g. a framework error handler) without losing context.
- The class name (via `constructor.name`) enables `switch` over union error types without casting.
- Validated construction types eliminate entire classes of runtime checks from downstream code.
- Early-return chains keep business logic readable by separating the happy path from error plumbing.

### Negative

- More boilerplate per error type compared to throwing plain strings.
- Validated construction types add indirection for simple cases.

### Risks

- Misclassification: treating a recoverable error as unchecked (and crashing) or a programming bug as checked (and papering over it). Apply the litmus test: could a well-written caller do something meaningful with the error? If yes, it is checked. If no, it is a bug — throw.

## Compliance and Enforcement

- All custom error classes must extend `Error` — enforced by `archgate check`.
- `try/catch` is valid for calling functions that have not typed their errors. Do not replace it with a tuple wrapper unless the function you are writing wants to return a typed tuple to its callers.

## References

- [Rust Error Handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html) — Decision framework for recoverable vs unrecoverable errors
- Effective Java, Item 70 — Use checked exceptions for recoverable conditions (Bloch, 2018)
- GEN-002 — Function Design: Single Responsibility and Orchestration Layers
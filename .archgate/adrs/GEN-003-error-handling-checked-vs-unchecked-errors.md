---
id: GEN-003
title: Error Handling Checked vs Unchecked Errors
domain: general
rules: true
---

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

Use `Result` in all other cases where failure is a possibility a caller should handle.

When in doubt, default to `Result` — it is always safe to give the caller the choice. Reserve `throw` for clear contract violations and impossible states.

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

### Checked Errors — use `neverthrow`

Checked errors represent **expected, recoverable failure modes** that callers must explicitly handle. Model them with `Result<T, E>` or `ResultAsync<T, E>` from `neverthrow`.

Use `neverthrow` for:

- I/O that can fail (file not found, network error, parse failure)
- Validation failures (invalid user input, schema mismatch)
- External service errors (API returning an error status)
- Any condition where the caller needs to branch on success vs failure

Returning `Result` is the **good default** when defining a function that might fail — it gives calling code the option to decide recovery strategy for their context.

Every checked error type must extend `Error` so it is throwable at an integration boundary if needed and carries a stack trace:

```ts
class ConfigNotFoundError extends Error {
  constructor(public readonly path: string) {
    super(`Config file not found: ${path}`);
    this.name = "ConfigNotFoundError";
  }
}

// usage
function readConfig(path: string): ResultAsync<Config, ConfigNotFoundError> {
  return ResultAsync.fromPromise(
    Bun.file(path).json(),
    () => new ConfigNotFoundError(path)
  );
}
```

### Consuming results with `match`

At the orchestration layer (CLI handlers, composition root), use `result.match(ok, err)` to consume results. This is the preferred pattern for extracting values or handling terminal errors — it forces both branches to be addressed in a single expression:

```ts
const user = findUserByAlias(users, alias).match(
  (v) => v,
  (e) => { console.error(e.message); process.exit(1); },
);
```

Prefer `match` over `isOk()`/`isErr()` conditionals — it eliminates the need for intermediate variables and makes the code more declarative.

### Error propagation and composition

Keep the happy path linear. Errors should propagate automatically through chains — avoid deeply nested match blocks for sequencing fallible operations.

Use `.andThen()` to sequence operations where each step can fail — the chain short-circuits on the first error, like an early return:

```ts
function loadApp(configPath: string): ResultAsync<App, ConfigNotFoundError | SchemaError> {
  return readConfig(configPath)
    .andThen(validateSchema)
    .andThen(buildApp);
}
```

Use `.mapErr()` to convert error types at layer boundaries — this keeps error types domain-scoped and prevents lower-layer details from leaking upward:

```ts
// At the boundary between "file layer" and "config layer":
readFile(path)
  .mapErr((e) => new ConfigLoadError(path, { cause: e }))
```

Use `.map()` to transform success values without affecting the error channel.

### Validated construction types

Instead of validating the same constraint at every call site, create types whose constructors enforce invariants so downstream code is **guaranteed** valid values. Parse the input once at the boundary; after that the type carries the proof.

```ts
class PortNumber {
  private constructor(public readonly value: number) {}

  static create(value: number): Result<PortNumber, InvalidPortError> {
    if (value < 1 || value > 65535) {
      return err(new InvalidPortError(value));
    }
    return ok(new PortNumber(value));
  }
}

// Downstream: accepts PortNumber, never needs to re-validate
function listen(port: PortNumber): ResultAsync<Server, BindError> { ... }
```

Key principles:

- Keep the inner value **private** — force all construction through the validated factory.
- The factory returns `Result`, making invalid input a checked error.
- Functions that accept the validated type **never need runtime checks** on that constraint — the constructor already did the work.
- Prefer narrower types over runtime assertions: `number` that is always positive → `PositiveInt`, a string that is always a valid email → `EmailAddress`.

### Wrapping third-party code

When a function **wants to produce a `Result`** for its callers, third-party throwing code at that boundary should be wrapped using `fromThrowable` or `fromPromise`:

```ts
const safeParse = fromThrowable(JSON.parse, (e) => new JsonParseError(String(e)));
```

### When `try/catch` is appropriate

`Result` is a tool for the **producer** — a function that wants to type its error paths so callers can handle them. It is **not** a syntax replacement for `try/catch` at the call site.

If you are **calling** a function that throws (and has not typed its errors with `Result`), a standard `try/catch` is preferred for clarity and familiarity:

```ts
// ✅ Good — the called function throws, caller handles it simply
try {
  const parsed = WorkerToMain.parse(message);
  handler(parsed);
} catch (error) {
  logger.error("Failed to parse message from worker:", error);
}

// ❌ Bad — wrapping an untyped throwing call in Result adds complexity with no benefit
Result.fromThrowable(
  () => {
    const parsed = WorkerToMain.parse(message);
    handler(parsed);
  },
  (e) => (e instanceof Error ? e : new Error(String(e))),
)().mapErr((error) => {
  logger.error("Failed to parse message from worker:", error);
});
```

The key distinction: **only use `Result.fromThrowable` / `ResultAsync.fromPromise` when the function you are writing wants to return a typed `Result` to its own callers.** If you are simply guarding against a throwing call and handling the error locally, `try/catch` is the right tool.

### Tests and prototype code

In tests, `._unsafeUnwrap()` is acceptable — a test that hits an unexpected `Err` should fail loudly, which serves the same purpose as a test assertion. Treat it as shorthand for "this must succeed or the test is broken."

In prototype or spike code, `._unsafeUnwrap()` serves as a marker for "error handling not yet implemented." Grep for `_unsafeUnwrap` before shipping to ensure all call sites have been replaced with proper handling.

## Do's and Don'ts

### Do

- Use `throw` for contract violations, programmer errors, and process-fatal conditions.
- Use `Result` / `ResultAsync` for any failure a caller must handle.
- Default to `Result` when unsure — it is always safe to give the caller the choice.
- Extend `Error` for every custom error class — both checked and unchecked.
- Set `this.name` on every error class to enable discrimination (e.g. `this.name = "ConfigNotFoundError"`).
- Use `fromThrowable` / `fromPromise` when your function wants to **produce** a `Result` from third-party throwing code.
- Use `try/catch` when **consuming** a throwing function that has not typed its errors — prefer clarity and familiarity over custom syntax.
- Co-locate error classes with the function that produces them.
- Use `result.match(ok, err)` to consume results at the orchestration layer — prefer it over `isOk()`/`isErr()` conditionals.
- Use `.andThen()` chains to keep the happy path linear when sequencing fallible operations.
- Use `.mapErr()` to convert error types at layer boundaries.
- Create validated construction types to make invalid states unrepresentable.
- Document function contracts (including throw conditions) in JSDoc.

### Don't

- Don't use `neverthrow` for programmer errors — a `Result<never, InvariantError>` that is always `Err` is not a checked error, it is a crash.
- Don't catch and re-throw generic `unknown` errors — map them to a typed class immediately.
- Don't return `T | null` or `T | undefined` for operations that can fail — use `Result`.
- Don't return `boolean` for operations that can fail — use `Result<void, E>`.
- Don't use `T | undefined` when the **reason** for absence matters — use `Result` so the caller knows *why* it failed.
- Don't share error classes across unrelated domains.
- Don't use bare `Promise<T>` for async operations that can fail — use `ResultAsync<T, E>`.
- Don't use `isOk()`/`isErr()` conditionals to consume results — use `result.match()` instead.
- Don't write deeply nested `match` blocks to sequence fallible operations — use `.andThen()` chains.
- Don't replace a simple `try/catch` with `Result.fromThrowable()` when the called function has not typed its errors with `Result` — the `Result` type is for the **producer** to describe checked exceptions, not for the **caller** to add unnecessary syntax around untyped throwing code.

## Consequences

### Positive

- The type signature of every function declares exactly which failures the caller must handle.
- Unchecked errors still surface loudly with full stack traces.
- Error classes that extend `Error` can always be thrown at an integration boundary (e.g. a framework error handler) without losing context.
- The `name` property on error classes enables `switch` over union error types without casting.
- Validated construction types eliminate entire classes of runtime checks from downstream code.
- `.andThen()` chains keep business logic readable by separating the happy path from error plumbing.

### Negative

- More boilerplate per error type compared to throwing plain strings.
- Developers unfamiliar with `neverthrow` face a learning curve.
- Validated construction types add indirection for simple cases.

### Risks

- Misclassification: treating a recoverable error as unchecked (and crashing) or a programming bug as checked (and papering over it). Apply the litmus test: could a well-written caller do something meaningful with the error? If yes, it is checked. If no, it is a bug — throw.

## Compliance and Enforcement

- `neverthrow` must remain a direct dependency in `package.json`. Removal requires a superseding ADR.
- All custom error classes must extend `Error` — enforced by `archgate check`.
- `_unsafeUnwrap()` must not appear in `src/` outside of test files — enforced by `archgate check`.
- `try/catch` is valid for calling functions that have not typed their errors with `Result`. Do not replace it with `Result.fromThrowable()` / `ResultAsync.fromPromise()` unless the function you are writing wants to return a typed `Result` to its callers.

## References

- [neverthrow — Type-Safe Errors for JS and TypeScript](https://github.com/supermacro/neverthrow)
- [Rust Error Handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html) — Decision framework for recoverable vs unrecoverable errors
- Effective Java, Item 70 — Use checked exceptions for recoverable conditions (Bloch, 2018)
- GEN-002 — Function Design: Single Responsibility and Orchestration Layers
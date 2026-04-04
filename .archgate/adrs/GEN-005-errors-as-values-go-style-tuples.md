---
id: GEN-005
title: Errors as Values Using Go-Style Tuples for Known Exceptions
domain: general
rules: true
supersedes:
  - BE-001
  - GEN-003
---

# ADR: Adopt "Errors as Values" using Go-Style Tuples for Known Exceptions

**Status:** Accepted
**Date:** April 4, 2026

## Context and Problem Statement

In standard TypeScript/JavaScript development, expected domain errors (e.g., "User Not Found", "Invalid Input") are traditionally handled by throwing exceptions and catching them with `try/catch` blocks. This presents several significant drawbacks:

- **Implicit Signatures:** Function signatures do not document what exceptions they throw. Consumers must rely on documentation or read the implementation to know what errors to handle.
- **Loss of Type Safety:** TypeScript types caught errors in a `catch` block as `unknown` or `any`. Developers lose all type safety, autocomplete, and compiler guarantees when interacting with the error object.
- **Control Flow Disruption:** Relying heavily on `try/catch` blocks leads to deep nesting ("arrow code") and scoping issues with variables that need to be accessed outside the `try` block.
- **Library Coupling:** Using a custom wrapper utility (like a global `Result` type or a `goTry` function) introduces arbitrary dependencies and forces consumers to learn our specific utility types.

We need a pattern for handling known domain errors that is zero-dependency, strictly type-safe, and self-documenting.

## Decision

We will adopt an "Errors as Values" pattern for all known, expected exceptions.

Functions will return a strongly typed, discriminated tuple in the format `[Result, null] | [undefined, CustomError]`, mirroring Go's `result, err` assignment pattern.

### Rules of Implementation

1. **No Wrapper Types:** The tuple union must be written directly inline in the function's return signature. We will not use global wrapper types or utility functions, ensuring zero coupling for consumers.
2. **Custom Error Classes:** We will return instantiated custom `Error` classes (e.g., `FooError`) rather than strings. This preserves standard `Error` behavior, including stack traces and custom properties (like `.code`).
3. **Return, Don't Throw:** Known exceptions are instantiated and returned on the right side of the tuple. The `throw` keyword is strictly reserved for unexpected, fatal developer or system errors (e.g., database connection drops, out-of-memory).

### Code Example

```ts
// 1. Define strongly-typed known errors
class FooError extends Error {
  constructor(public code: "INVALID_INPUT", message: string) {
    super(message);
    this.name = "FooError";
  }
}

// 2. Native inline tuple signatures (Producer)
function foo(value: string): [string, null] | [undefined, FooError] {
  if (!value) {
    return [undefined, new FooError("INVALID_INPUT", "Value is required")];
  }
  return [`Processed ${value}`, null];
}

// 3. Destructuring and type narrowing (Consumer)
function bar() {
  const [result, err] = foo("");

  if (err) {
    // TypeScript guarantees 'err' is FooError. Autocomplete works for err.code.
    console.error(err.code, err.message);
    return;
  }

  // TypeScript guarantees 'result' is a string.
  console.log(result);
}
```

### Async Functions

The same pattern applies to async functions. The tuple is returned inside the `Promise`:

```ts
async function fetchUser(id: string): Promise<[User, null] | [undefined, UserNotFoundError]> {
  const user = await db.users.find(id);
  if (!user) {
    return [undefined, new UserNotFoundError(id)];
  }
  return [user, null];
}

// Consumer
async function handleRequest(id: string) {
  const [user, err] = await fetchUser(id);

  if (err) {
    console.error(err.message);
    return;
  }

  console.log(user.name);
}
```

### Composing Multiple Fallible Calls

When sequencing multiple calls that can fail, use early returns to keep the happy path linear:

```ts
async function processOrder(orderId: string) {
  const [order, orderErr] = await findOrder(orderId);
  if (orderErr) return [undefined, orderErr] as const;

  const [validated, validErr] = validateOrder(order);
  if (validErr) return [undefined, validErr] as const;

  const [receipt, submitErr] = await submitOrder(validated);
  if (submitErr) return [undefined, submitErr] as const;

  return [receipt, null] as const;
}
```

## Do's and Don'ts

### Do

- **Do** return known errors as values using the `[T, null] | [undefined, E]` tuple pattern.
- **Do** write the tuple union inline in the function's return type — no global wrapper types.
- **Do** use custom classes extending `Error` for all error types, preserving stack traces and enabling `instanceof` checks.
- **Do** use early `if (err) return` to keep the happy path linear.
- **Do** reserve `throw` for contract violations, programming bugs, and unrecoverable system failures.
- **Do** use `as const` when re-returning error tuples from composed calls to preserve type narrowing.

### Don't

- **Don't** use wrapper library `Result` types for new code — use native tuples instead.
- **Don't** return raw strings or plain objects as errors — always use `Error` subclasses.
- **Don't** throw known domain errors — return them in the tuple.
- **Don't** create global utility types or functions for the tuple pattern — the power is in the inline, zero-dependency signatures.
- **Don't** artificially wrap single operations in `try/catch` just to return a tuple (e.g., wrapping `lstatSync` in a `safeLstat` helper). If the API has a non-throwing option, use it directly.

### try/catch in Orchestrators

The goal is **not** to avoid all `try/catch` — it is to codify known errors. In an orchestrator with 4 or 5 operations that might each throw, `try/catch` is the right tool to categorise raw errors into known, typed failure patterns while keeping the underlying stack trace. See the [Errors as Values guide](../../docs/guides/errors-as-values.md#try-catch-in-orchestrators) for full examples.

## Consequences

### Positive

- **Complete Type Safety:** The TypeScript compiler enforces that the caller checks for the error before using the result. The error itself retains full type definitions.
- **Self-Documenting APIs:** A developer using our functions immediately sees exactly which custom errors they are expected to handle just by hovering over the function signature.
- **Zero Dependencies:** Because the types are inline standard tuples, consumers of our code do not need to import any specialized types from our library.
- **Better DX:** Callers can handle errors cleanly with early returns, avoiding nested `try/catch` blocks and variable scope issues.
- **Preserved Stack Traces:** By returning `new CustomError()`, we retain the V8 stack trace at the exact point of failure.

### Negative

- **Boilerplate Signatures:** Function return types are more verbose to write (`[T, null] | [undefined, E]`).
- **Non-Standard JS Paradigm:** This breaks away from standard JavaScript conventions. New developers will need a brief onboarding to understand why we aren't throwing.
- **Two Error Channels:** Consumers still need to be aware that true, fatal exceptions (like `TypeError` or network failures) will still throw and might require an outer boundary `catch` at the highest level of the application.

### Risks

- **Paradigm Shift:** Developers familiar with exception-based error handling will need onboarding on the tuple pattern.

## Supersedes

This ADR supersedes:

- **BE-001** — Standardized Error Handling (deleted)
- **GEN-003** — Error Handling: Checked vs Unchecked Errors

## Compliance and Enforcement

- All custom error classes must extend `Error` — enforced by `archgate check`.
- New code must use the tuple return pattern for known errors — enforced during code review.
- `throw` is reserved for contract violations and unrecoverable errors — enforced during code review.

## References

- [Go Error Handling](https://go.dev/blog/error-handling-and-go) — The original inspiration for errors as values
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- GEN-002 — Function Design: Single Responsibility and Orchestration Layers

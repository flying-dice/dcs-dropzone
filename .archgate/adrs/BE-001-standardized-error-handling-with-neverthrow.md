---
id: BE-001
title: Standardized Error Handling with Neverthrow
domain: backend
rules: false
status: deprecated
superseded_by: GEN-005
---

> **⚠️ DEPRECATED:** This ADR has been superseded by [GEN-005 — Errors as Values Using Go-Style Tuples](./GEN-005-errors-as-values-go-style-tuples.md). New code must use the Go-style tuple pattern instead of `neverthrow`. Existing `neverthrow` usage may remain during the migration period.

# Standardized Error Handling with Neverthrow

## Context

We use the `neverthrow` library to manage control flow and handle errors predictably using the `Result<T, E>` pattern. However, without strict conventions on the `E` (Error) type, developers can return arbitrary data, such as plain strings (`err("Something went wrong")`) or generic Error objects (`err(new Error("Failed"))`).

This lack of standardization leads to several issues across our architectural boundaries:
1. **Poor Pattern Matching:** Catching and responding to specific errors requires fragile string matching.
2. **Missing Stack Traces:** Returning plain strings or objects for system-level failures strips away the stack trace, making debugging infrastructure I/O errors incredibly difficult.
3. **Serialization Issues:** Standard `Error` objects drop their custom properties and stack traces when serialized via `JSON.stringify()`, causing problems when returning domain results across network boundaries (e.g., to a frontend client).
4. **Lack of Exhaustiveness:** TypeScript cannot enforce that the caller has handled every possible failure mode in the Application/Use Case layer.

## Decision

We will strictly enforce the use of **Discriminated Unions** for all `neverthrow` error payloads. Every error returned in an `err()` wrapper must possess a literal string `type` property.

All error types must be **classes extending `Error`** with a readonly literal `type` property. This applies uniformly to both domain-level and infrastructure-level errors. Classes provide stack traces for debugging, integrate with APMs, and work naturally with `instanceof` checks while still supporting discriminated union narrowing via the `type` property.

## Do's and Don'ts

### Do

- **Do** ensure every error returned by `neverthrow` has a literal string `type` property (e.g., `type: 'ValidationError'`).
- **Do** use custom classes extending `Error` with a readonly literal `type` property for all error types.
- **Do** use `switch (error.type)` in your application layer to exhaustively handle specific failure modes.

### Don't

- **Don't** return plain strings as errors (`err("User not found")`).
- **Don't** throw exceptions for expected business logic paths; reserve `throw` for truly unrecoverable panics.
- **Don't** use plain objects as error types; always use classes extending `Error`.

## Consequences

### Positive

- **Type Safety:** The caller knows exactly what can go wrong and can handle it safely using type narrowing.
- **Better Debugging:** All errors retain their stack traces and integrate seamlessly with observability tools.
- **Consistency:** A single error pattern across all layers reduces cognitive overhead and simplifies error handling code.

### Negative

- **Increased Boilerplate:** Developers must write slightly more code to define explicit error types and unions rather than throwing a generic error string.

### Risks

- **Habitual Regression:** Developers familiar with simple string errors may initially forget to define proper structured types, requiring enforcement during code review.

## Compliance and Enforcement

This ADR currently relies on manual enforcement during Pull Request reviews.

*Note: In the future, we may set `rules: true` and implement a companion `.rules.ts` file via the Archgate CLI to statically analyze ASTs and automatically block `err()` calls that contain literal strings.*

## References

- [Neverthrow Documentation](https://github.com/supermacro/neverthrow)
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

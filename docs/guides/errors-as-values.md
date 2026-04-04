# Errors as Values

This guide explains how to handle known, expected errors in this codebase using the "Errors as Values" pattern with Go-style tuples, as defined in [GEN-005](https://github.com/flying-dice/dcs-dropzone/blob/main/.archgate/adrs/GEN-005-errors-as-values-go-style-tuples.md).

## The Pattern

Instead of throwing exceptions for known domain errors, functions return a strongly typed tuple:

```ts
[Result, null] | [undefined, CustomError]
```

This mirrors Go's `result, err` assignment pattern. The caller destructures the tuple and checks for the error before using the result — TypeScript's type narrowing guarantees safety.

## Quick Start

### 1. Define a Custom Error

Every known error is a class extending `Error`. This preserves stack traces and enables `instanceof` checks.

```ts
class UserNotFoundError extends Error {
  constructor(public readonly userId: string) {
    super(`User not found: ${userId}`);
    this.name = "UserNotFoundError";
  }
}
```

### 2. Return Errors as Values

The function signature declares exactly which errors can occur. Known errors are returned, never thrown.

```ts
function findUser(id: string): [User, null] | [undefined, UserNotFoundError] {
  const user = users.get(id);
  if (!user) {
    return [undefined, new UserNotFoundError(id)];
  }
  return [user, null];
}
```

### 3. Consume with Destructuring

Callers destructure the tuple and check for errors with an early return. After the check, TypeScript knows the result is the success type.

```ts
function greetUser(id: string) {
  const [user, err] = findUser(id);

  if (err) {
    // TypeScript knows 'err' is UserNotFoundError
    console.error(err.message);
    return;
  }

  // TypeScript knows 'user' is User
  console.log(`Hello, ${user.name}`);
}
```

## Async Functions

The same pattern works with `async/await`. The tuple is returned inside the `Promise`:

```ts
async function fetchUser(id: string): Promise<[User, null] | [undefined, UserNotFoundError]> {
  const user = await db.users.find(id);
  if (!user) {
    return [undefined, new UserNotFoundError(id)];
  }
  return [user, null];
}

// Consumer
const [user, err] = await fetchUser("123");
if (err) {
  // handle error
  return;
}
// use user
```

## Composing Multiple Calls

When a function calls several fallible functions in sequence, use early returns to keep the happy path linear:

```ts
async function processOrder(
  orderId: string,
): Promise<[Receipt, null] | [undefined, OrderNotFoundError | ValidationError | PaymentError]> {
  const [order, orderErr] = await findOrder(orderId);
  if (orderErr) return [undefined, orderErr] as const;

  const [validated, validErr] = validateOrder(order);
  if (validErr) return [undefined, validErr] as const;

  const [receipt, payErr] = await submitPayment(validated);
  if (payErr) return [undefined, payErr] as const;

  return [receipt, null] as const;
}
```

Use `as const` when re-returning error tuples to preserve the discriminated union for callers.

## Multiple Error Types

When a function can produce different errors, list them all in the union:

```ts
function parseConfig(
  raw: string,
): [Config, null] | [undefined, JsonParseError | SchemaValidationError] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [undefined, new JsonParseError(raw)];
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return [undefined, new SchemaValidationError(result.error)];
  }

  return [result.data, null];
}
```

The caller can then narrow on the specific error type:

```ts
const [config, err] = parseConfig(rawInput);
if (err) {
  if (err instanceof JsonParseError) {
    console.error("Invalid JSON:", err.message);
  } else {
    console.error("Schema error:", err.message);
  }
  return;
}
```

## When to Throw

`throw` is reserved for **unexpected, fatal errors** — contract violations, programming bugs, and unrecoverable system failures. These are not errors the caller is expected to handle:

```ts
// Contract violation — caller passed bad input, this is a bug
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Division by zero — this is a programming error");
  }
  return a / b;
}
```

If a well-written caller could do something meaningful with the error, return it as a value. If the error means the program is in a broken state, throw.

## Migration from neverthrow

This pattern supersedes the previous `neverthrow` `Result` pattern. When modifying existing files that use `neverthrow`:

1. Convert `Result<T, E>` return types to `[T, null] | [undefined, E]`
2. Replace `ok(value)` with `[value, null]`
3. Replace `err(error)` with `[undefined, error]`
4. Replace `.andThen()` chains with sequential destructuring and early returns
5. Replace `.match()` calls with `if (err)` checks

**Existing `neverthrow` code does not need to be converted immediately** — convert when you are already modifying the file.

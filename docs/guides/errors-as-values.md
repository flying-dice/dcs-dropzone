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

## try/catch in Orchestrators

The goal of the tuple pattern is **not** to eliminate all `try/catch` — it is to codify known errors at meaningful boundaries. Wrapping a single standard library call in `try/catch` just to return a tuple adds noise with no benefit. Use `try/catch` naturally when it is the clearest way to handle an operation, and return typed tuples from orchestrators that categorise multiple failure points into known error patterns.

### ❌ Don't: Artificially wrap single operations

Creating a helper that wraps one call in `try/catch` just to return a tuple is pointless — it wraps errors with errors for the sake of it:

```ts
// ❌ Bad — artificial wrapper around a single call
function safeLstat(path: string): [Stats | undefined, null] | [undefined, Error] {
  try {
    return [lstatSync(path, { throwIfNoEntry: false }), null];
  } catch (e) {
    return [undefined, e instanceof Error ? e : new Error(String(e))];
  }
}
```

Instead, call the function directly. Many Node.js APIs already have non-throwing options:

```ts
// ✅ Good — use the API's own non-throwing option
const stat = lstatSync(path, { throwIfNoEntry: false });
if (!stat) {
  // handle missing file
}
```

### ✅ Do: Use try/catch in orchestrators to categorise failures

Orchestrators coordinate 4–5 operations that might each fail. Here, `try/catch` is valuable because you **categorise** the raw error into a known, typed failure while preserving the original stack trace:

```ts
class SymlinkCreationFailed extends Error {
  constructor(
    readonly linkId: string,
    readonly code: LinkerErrorCode,
    message: string,
  ) {
    super(`Failed to create symlink for ${linkId}: ${message}`);
  }
}

async function createLink(
  link: LinkDefinition,
): Promise<[ResolvedLink, null] | [undefined, SymlinkCreationFailed]> {
  // 1. Source must exist — no try/catch needed, API has non-throwing option
  const srcStat = lstatSync(link.src, { throwIfNoEntry: false });
  if (!srcStat) {
    return [undefined, new SymlinkCreationFailed(link.id, "SOURCE_NOT_FOUND", `Source does not exist: ${link.src}`)];
  }

  // 2. Ensure parent directory — try/catch categorises the failure
  try {
    const parent = dirname(link.dest);
    if (!lstatSync(parent, { throwIfNoEntry: false })) {
      mkdirSync(parent, { recursive: true });
    }
  } catch (e) {
    return [undefined, new SymlinkCreationFailed(link.id, "LINK_CREATION_FAILED", `Failed to create parent dir: ${e}`)];
  }

  // 3. Dest must not exist — try/catch catches permission errors
  try {
    if (lstatSync(link.dest, { throwIfNoEntry: false })) {
      return [undefined, new SymlinkCreationFailed(link.id, "ALREADY_EXISTS", `Dest already exists: ${link.dest}`)];
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return [undefined, new SymlinkCreationFailed(link.id, "PERMISSION_DENIED", `Cannot access dest: ${msg}`)];
  }

  // 4. Create the link
  const [, mklinkErr] = await mklink({ link: link.dest, target: link.src });
  if (mklinkErr) {
    return [undefined, new SymlinkCreationFailed(link.id, "LINK_CREATION_FAILED", mklinkErr[1])];
  }

  return [{ id: link.id, src: link.src, dest: link.dest }, null];
}
```

The key difference: the orchestrator **adds value** by mapping raw errors from different operations (stat, mkdir, mklink) into a single typed error (`SymlinkCreationFailed`) with a meaningful error code. The caller gets a known failure pattern they can act on.

### The rule of thumb

- **Single operation?** Call it directly. Use the API's non-throwing option if available, or let it throw naturally.
- **Orchestrator with multiple failure points?** Use `try/catch` to categorise raw errors into known typed errors. Return those as tuples so the caller gets a clean, actionable API.

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

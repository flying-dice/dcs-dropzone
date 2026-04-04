# Plan: Structured Error Codes for Enable/Disable Mod API

## Context

The Daemon API's 422 error responses currently return only a class name as `reason` with no structured detail. Users can't tell *why* enabling/disabling failed. The error classes internally carry rich info (`SymlinkCreationFailed` has a `LinkerErrorCode` enum, release IDs, file paths) but none of it reaches the API consumer.

**Key constraint:** Error responses must be structured with machine-readable codes so the client (webapp) can map them to localised user-facing strings. System-level errors (e.g. `EPERM` from `mklink`) should be surfaced as they help users diagnose issues. Avoid leaking TypeScript-specific details (stack traces, class names) but OS/filesystem errors are fair game.

Additionally, the webapp consumer at `apps/webapp/src/ui/commands/ToggleReleaseById.ts:35-44` reads `data.error` which doesn't exist in the response. The disable endpoint silently swallows partial symlink removal failures.

## Design Principles

1. **Structured codes, not messages** — Return machine-readable codes that clients map to localised UI strings
2. **Surface system-level errors** — OS/filesystem errors (e.g. `EPERM`, `EEXIST`) are useful diagnostic info for the user and should be included in the response. Avoid leaking TypeScript internals (stack traces, class names) but system errors are fair game.
3. **Discriminated unions** — Each error `reason` has its own Zod schema shape, composed via `z.discriminatedUnion("reason", [...])`
4. **Client-actionable** — Error shapes carry enough structured context for the client to tell the user what to do

## Changes

### 1. Define reusable data schemas and per-error Zod schemas

#### 1a. Reusable data schemas
**File:** `apps/daemon/src/application/schemas/InvalidPathData.ts` (new)

Extract the shared path validation error shape into a reusable schema. This is not toggle-specific — any endpoint that validates a configured path can use it.

```typescript
import { z } from "zod";

export const InvalidPathData = z.object({
  errorCode: z.enum(["PATH_NOT_FOUND"]),
  path: z.string(), // the configured path that failed validation
});
```

#### 1b. Toggle error schemas
**File:** `apps/daemon/src/application/schemas/ToggleErrors.ts` (new)

Each error type gets its own Zod object schema with `reason` as the discriminant. The error side of the Go-style tuple is the Zod-inferred type — plain data, not an Error class.

```typescript
import { z } from "zod";
import { InvalidPathData } from "./InvalidPathData.ts";

export const ReleaseNotFoundError = z.object({
  reason: z.literal("ReleaseNotFound"),
});

export const ReleaseNotReadyError = z.object({
  reason: z.literal("ReleaseNotReady"),
  pendingCount: z.number().int(),  // jobs still pending/running
  failedCount: z.number().int(),   // jobs that failed
});

export const DropzoneModsDirNotConfiguredError = z.object({
  reason: z.literal("DropzoneModsDirNotConfigured"),
});

export const DropzoneModsDirInvalidError = z.object({
  reason: z.literal("DropzoneModsDirInvalid"),
}).merge(InvalidPathData);

export const DcsPathNotConfiguredError = z.object({
  reason: z.literal("DcsPathNotConfigured"),
});

export const DcsPathInvalidError = z.object({
  reason: z.literal("DcsPathInvalid"),
}).merge(InvalidPathData);

export const SymlinkCreationFailedError = z.object({
  reason: z.literal("SymlinkCreationFailed"),
  errorCode: z.enum([
    "SOURCE_NOT_FOUND",
    "LINK_ALREADY_EXISTS",
    "PERMISSION_DENIED",
    "LINK_CREATION_FAILED",
  ]),
  systemError: z.string().optional(), // e.g. "EPERM: operation not permitted, symlink '...' -> '...'"
});

export const PartialDisableFailureError = z.object({
  reason: z.literal("PartialDisableFailure"),
  removedCount: z.number().int(),
  failedCount: z.number().int(),
  systemError: z.string().optional(), // OS-level error from failed removals
});

// Composed unions for each endpoint
export const EnableReleaseError = z.discriminatedUnion("reason", [
  ReleaseNotFoundError,
  ReleaseNotReadyError,
  DropzoneModsDirNotConfiguredError,
  DropzoneModsDirInvalidError,
  DcsPathNotConfiguredError,
  DcsPathInvalidError,
  SymlinkCreationFailedError,
]);

export const DisableReleaseError = z.discriminatedUnion("reason", [
  ReleaseNotFoundError,
  DcsPathNotConfiguredError,
  DcsPathInvalidError,
  PartialDisableFailureError,
]);

export const ToggleReleaseError = z.discriminatedUnion("reason", [
  ReleaseNotFoundError,
  ReleaseNotReadyError,
  DropzoneModsDirNotConfiguredError,
  DropzoneModsDirInvalidError,
  DcsPathNotConfiguredError,
  DcsPathInvalidError,
  SymlinkCreationFailedError,
  PartialDisableFailureError,
]);
```

Each endpoint gets its own discriminated union containing only the errors it can produce. The client receives a response body whose shape varies by `reason`, allowing type-safe narrowing and localisation mapping.

### 2. Refactor application layer to return structured error data
**Files:** `apps/daemon/src/application/services/ReleaseToggle.ts`, `apps/daemon/src/application/services/PathResolver.ts`

The error side of the Go-style tuple changes from Error class instances to plain data objects matching the Zod schema types (i.e. `z.infer<typeof EnableReleaseError>` etc.).

The `checkReleaseIsReady` method currently returns a boolean. It needs to be expanded to query the job states and return counts so the error data includes `pendingCount` and `failedCount`. This lets the client distinguish between "still downloading" (pending > 0) and "download failed" (failed > 0) and show appropriate messaging.

`PathResolver` currently conflates "not configured" with "path doesn't exist" under one error. Split into distinct cases:

```typescript
// Setting is empty/missing
return [undefined, { reason: "DropzoneModsDirNotConfigured" as const }];

// Setting has a value but path doesn't exist on disk
return [undefined, { reason: "DropzoneModsDirInvalid" as const, errorCode: "PATH_NOT_FOUND" as const, path: dropzoneModsFolder }];
```

Same split for DCS path:
```typescript
return [undefined, { reason: "DcsPathNotConfigured" as const }];
return [undefined, { reason: "DcsPathInvalid" as const, errorCode: "PATH_NOT_FOUND" as const, path: rootPath }];
```

The `path` field is included because it's user-configured data, not an internal implementation detail — the user needs to see which path is invalid so they can fix it in settings.

And where `ReleaseToggle.enable()` encounters a `SymlinkCreationFailed` from the linker, it passes through the system-level error message:
```typescript
return [undefined, { reason: "SymlinkCreationFailed" as const, errorCode: linkerErr.code, systemError: linkerErr.message }];
```

For partial disable failures:
```typescript
return [undefined, {
  reason: "PartialDisableFailure" as const,
  removedCount: removedIds.length,
  failedCount: linkerErr.failed.length,
  systemError: linkerErr.failed.map(f => f.message).join("; "),
}];
```

The `ReleaseToggleError` type becomes `z.infer<typeof ToggleReleaseError>` (or the specific endpoint union type). The internal Error classes (`ReleaseNotFound`, `ReleaseNotReady`, etc.) can be removed or kept only for logging purposes — they no longer cross the API boundary.

### 3. Simplify Hono route handlers — just pass through
**File:** `apps/daemon/src/hono/HonoApplication.ts`

The handler becomes trivially simple — no mapping, no helper function. The application already returns the exact data shape the API needs:

```typescript
const [, enableErr] = await c.var.app.enableRelease(releaseId);
if (enableErr) {
  logger.error("Failed to enable release %s: %s", releaseId, enableErr.reason);
  return c.json(enableErr, StatusCodes.UNPROCESSABLE_ENTITY);
}
```

Update `describeRoute` OpenAPI response schemas to reference the discriminated union schemas.

### 4. Update `Application.ts` return types
**File:** `apps/daemon/src/application/Application.ts`

Update `enableRelease()`, `disableRelease()`, and `toggleRelease()` return types to use the Zod-inferred error types from the schemas.

### 5. Fix webapp consumer
**File:** `apps/webapp/src/ui/commands/ToggleReleaseById.ts`

Update error handling to read the structured response body. The webapp can now switch on `reason` and use type-narrowed fields (e.g. `errorCode` for `SymlinkCreationFailed`, `failedCount` for `PartialDisableFailure`) to build localised messages.

### 6. Update tests
**File:** `apps/daemon/src/hono/HonoApplication.test.ts`

- Update existing 422 assertions to verify response body matches the discriminated union shape
- Add test for `SymlinkCreationFailed` verifying `errorCode` field is present
- Add test for `PartialDisableFailure` verifying `removedCount` and `failedCount` fields
- Verify no raw error messages or file paths appear in response bodies

### 7. Regenerate OpenAPI schema
**File:** `apps/daemon/openapi.schema.json`

Run schema generation — the discriminated union will produce a `oneOf` with distinct schemas per reason in the OpenAPI spec, making it self-documenting for client developers.

## Error Code Reference (for client localisation)

| `reason` | Additional fields | User-actionable meaning |
|---|---|---|
| `ReleaseNotFound` | — | The mod/release no longer exists |
| `ReleaseNotReady` | `pendingCount: number`, `failedCount: number` | Jobs not yet complete — client can distinguish "still downloading" (pending > 0) from "download failed" (failed > 0) |
| `DropzoneModsDirNotConfigured` | — | Dropzone mods directory needs to be configured in settings |
| `DropzoneModsDirInvalid` | `errorCode: PATH_NOT_FOUND`, `path: string` | Configured dropzone mods directory doesn't exist on disk |
| `DcsPathNotConfigured` | — | DCS installation path needs to be configured in settings |
| `DcsPathInvalid` | `errorCode: PATH_NOT_FOUND`, `path: string` | Configured DCS path doesn't exist on disk |
| `SymlinkCreationFailed` | `errorCode: SOURCE_NOT_FOUND \| LINK_ALREADY_EXISTS \| PERMISSION_DENIED \| LINK_CREATION_FAILED`, `systemError?: string` | Symlink creation failed — `errorCode` tells the client the specific cause, `systemError` carries the OS-level error (e.g. `EPERM: operation not permitted`) |
| `PartialDisableFailure` | `removedCount: number`, `failedCount: number`, `systemError?: string` | Some mod files could not be removed during disable |

## Verification

1. Run existing tests: `bun test` in `apps/daemon` and `packages/linker`
2. Verify new tests pass for discriminated union response shapes
3. Verify `systemError` surfaces OS-level errors (e.g. `EPERM`) where applicable
4. Regenerate OpenAPI schema and verify `oneOf` discriminated union appears for 422 responses
5. Check webapp reads structured error bodies correctly

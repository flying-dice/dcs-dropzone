# Plan: Structured Error Codes for Enable/Disable Mod API

## Context

The Daemon API's 422 error responses currently return only a class name as `reason` with no structured detail. Users can't tell *why* enabling/disabling failed. The error classes internally carry rich info (`SymlinkCreationFailed` has a `LinkerErrorCode` enum, release IDs, file paths) but none of it reaches the API consumer.

**Key constraint:** Error responses must be structured with machine-readable codes so the client (webapp) can map them to localised user-facing strings. Raw error messages, file paths, and TypeScript-specific details must stay server-side in logs only.

Additionally, the webapp consumer at `apps/webapp/src/ui/commands/ToggleReleaseById.ts:35-44` reads `data.error` which doesn't exist in the response. The disable endpoint silently swallows partial symlink removal failures.

## Design Principles

1. **Structured codes, not messages** — Return machine-readable codes that clients map to localised UI strings
2. **No leaking internals** — File paths, link IDs, and raw error messages stay in server logs only
3. **Discriminated unions** — Each error `reason` has its own Zod schema shape, composed via `z.discriminatedUnion("reason", [...])`
4. **Client-actionable** — Error shapes carry enough structured context for the client to tell the user what to do

## Changes

### 1. Define per-error Zod schemas in `application/schemas/`
**File:** `apps/daemon/src/application/schemas/ToggleErrors.ts` (new)

Each error type gets its own Zod object schema with `reason` as the discriminant. The error side of the Go-style tuple returns the matching zod-inferred type.

```typescript
import { z } from "zod";

export const ReleaseNotFoundError = z.object({
  reason: z.literal("ReleaseNotFound"),
});

export const ReleaseNotReadyError = z.object({
  reason: z.literal("ReleaseNotReady"),
});

export const DropzoneModsDirNotConfiguredError = z.object({
  reason: z.literal("DropzoneModsDirNotConfigured"),
});

export const DcsPathNotConfiguredError = z.object({
  reason: z.literal("DcsPathNotConfigured"),
});

export const SymlinkCreationFailedError = z.object({
  reason: z.literal("SymlinkCreationFailed"),
  errorCode: z.enum([
    "SOURCE_NOT_FOUND",
    "LINK_ALREADY_EXISTS",
    "PERMISSION_DENIED",
    "LINK_CREATION_FAILED",
  ]),
});

export const PartialDisableFailureError = z.object({
  reason: z.literal("PartialDisableFailure"),
  removedCount: z.number().int(),
  failedCount: z.number().int(),
});

// Composed unions for each endpoint
export const EnableReleaseError = z.discriminatedUnion("reason", [
  ReleaseNotFoundError,
  ReleaseNotReadyError,
  DropzoneModsDirNotConfiguredError,
  DcsPathNotConfiguredError,
  SymlinkCreationFailedError,
]);

export const DisableReleaseError = z.discriminatedUnion("reason", [
  ReleaseNotFoundError,
  DcsPathNotConfiguredError,
  PartialDisableFailureError,
]);

export const ToggleReleaseError = z.discriminatedUnion("reason", [
  ReleaseNotFoundError,
  ReleaseNotReadyError,
  DropzoneModsDirNotConfiguredError,
  DcsPathNotConfiguredError,
  SymlinkCreationFailedError,
  PartialDisableFailureError,
]);
```

Each endpoint gets its own discriminated union containing only the errors it can produce. The client receives a response body whose shape varies by `reason`, allowing type-safe narrowing and localisation mapping.

### 2. Replace `UnprocessableEntityData` usage in Hono handlers
**File:** `apps/daemon/src/hono/HonoApplication.ts`

Replace the current pattern:
```typescript
const _UnprocessableEntityData = UnprocessableEntityData([...]);
// ...
return c.json(zParse({ reason: enableErr.type }, _UnprocessableEntityData), 422);
```

With:
```typescript
import { EnableReleaseError, DisableReleaseError, ToggleReleaseError } from "../application/schemas/ToggleErrors.ts";
// ...
return c.json(zParse(toErrorPayload(enableErr), EnableReleaseError), 422);
```

Add a helper that maps the internal error class to the structured payload:
```typescript
function toErrorPayload(err: ReleaseToggleError) {
  switch (err.type) {
    case "SymlinkCreationFailed":
      return { reason: err.type, errorCode: err.code };
    case "PartialDisableFailure":
      return { reason: err.type, removedCount: err.removedCount, failedCount: err.failedCount };
    default:
      return { reason: err.type };
  }
}
```

Update the `describeRoute` OpenAPI response schemas to reference the new discriminated union schemas instead of `UnprocessableEntityData`.

### 3. Add `PartialDisableFailure` error class
**File:** `apps/daemon/src/application/services/ReleaseToggle.ts`

```typescript
export class PartialDisableFailure extends Error {
  readonly type = "PartialDisableFailure" as const;
  constructor(
    readonly removedCount: number,
    readonly failedCount: number,
  ) {
    super(`${failedCount} symlink(s) could not be removed, ${removedCount} removed successfully`);
  }
}
```

Update `disable()` to return `PartialDisableFailure` when `linkerErr` exists (the mod is still marked disabled — current behaviour preserved). Update `ReleaseToggleError` union to include `PartialDisableFailure`.

### 4. Update `Application.ts` return types
**File:** `apps/daemon/src/application/Application.ts`

Update `disableRelease()` return type to include `PartialDisableFailure`.

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
| `ReleaseNotReady` | — | Download/extraction is still in progress |
| `DropzoneModsDirNotConfigured` | — | Dropzone mods directory needs to be configured in settings |
| `DcsPathNotConfigured` | — | DCS installation path needs to be configured in settings |
| `SymlinkCreationFailed` | `errorCode: SOURCE_NOT_FOUND \| LINK_ALREADY_EXISTS \| PERMISSION_DENIED \| LINK_CREATION_FAILED` | Symlink creation failed — `errorCode` tells the client the specific cause |
| `PartialDisableFailure` | `removedCount: number`, `failedCount: number` | Some mod files could not be removed during disable |

## Verification

1. Run existing tests: `bun test` in `apps/daemon` and `packages/linker`
2. Verify new tests pass for discriminated union response shapes
3. Verify no response body contains raw file paths or error messages (only structured codes)
4. Regenerate OpenAPI schema and verify `oneOf` discriminated union appears for 422 responses
5. Check webapp reads structured error bodies correctly

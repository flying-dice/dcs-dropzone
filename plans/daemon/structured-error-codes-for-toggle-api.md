# Plan: Structured Error Codes for Enable/Disable Mod API

## Context

The Daemon API's 422 error responses currently return only a class name as `reason` with no structured detail. Users can't tell *why* enabling/disabling failed. The error classes internally carry rich info (`SymlinkCreationFailed` has a `LinkerErrorCode` enum, release IDs, file paths) but none of it reaches the API consumer.

**Key constraint:** Error responses must be structured with machine-readable codes so the client (webapp) can map them to localised user-facing strings. Raw error messages, file paths, and TypeScript-specific details must stay server-side in logs only.

Additionally, the webapp consumer at `apps/webapp/src/ui/commands/ToggleReleaseById.ts:35-44` reads `data.error` which doesn't exist in the response. The disable endpoint silently swallows partial symlink removal failures.

## Design Principles

1. **Structured codes, not messages** — Return machine-readable `reason` + optional `errorCode` that clients map to localised UI strings
2. **No leaking internals** — File paths, link IDs, and raw error messages stay in server logs only
3. **Backwards-compatible** — `reason` field remains the top-level discriminant
4. **Client-actionable** — Error codes should tell the user what they can *do* about it

## Changes

### 1. Extend `UnprocessableEntityData` schema
**File:** `packages/hono/src/schemas.ts`

Add one optional field:
- `errorCode: z.string().optional()` — finer-grained machine-readable code within a `reason` category

The `reason` remains the error class discriminant (e.g. `"SymlinkCreationFailed"`). The `errorCode` provides sub-classification (e.g. `"SOURCE_NOT_FOUND"`, `"PERMISSION_DENIED"`). Both are stable, documented codes the client can localise.

No `detail` or `message` field with raw error text — that stays in server logs.

### 2. Add `PartialDisableFailure` error class
**File:** `apps/daemon/src/application/services/ReleaseToggle.ts`

New error class for when some symlink removals fail during disable:
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

No link IDs or paths exposed — just counts. The `message` is for server logs only.

Update `disable()` to return `PartialDisableFailure` when `linkerErr` exists (the mod is still marked disabled). Update `ReleaseToggleError` union to include `PartialDisableFailure`.

### 3. Update `Application.ts` return types
**File:** `apps/daemon/src/application/Application.ts`

Update `disableRelease()` return type to include `PartialDisableFailure`.

### 4. Update Hono route handlers
**File:** `apps/daemon/src/hono/HonoApplication.ts`

- Add a helper function that builds the response payload:
  - Always sets `reason: err.type`
  - For `SymlinkCreationFailed`, sets `errorCode: err.code` (the `LinkerErrorCode` enum value)
  - Never includes `err.message` — that's already logged via `logger.error`
- Update all three handlers (`toggleRelease`, `enableRelease`, `disableRelease`) to use this helper
- Add `PartialDisableFailure.name` to the disable and toggle endpoints' reason lists

### 5. Fix webapp consumer
**File:** `apps/webapp/src/ui/commands/ToggleReleaseById.ts`

Update error handling to read the structured `reason` and `errorCode` fields. The webapp is then responsible for mapping these codes to localised user-facing strings (this mapping is a separate concern for the webapp to implement).

Change from:
```typescript
const data = disableResponse.data as { error?: string };
return [undefined, new ToggleReleaseError(data?.error ?? "Failed to disable release")];
```
To:
```typescript
const data = disableResponse.data as { reason?: string; errorCode?: string };
return [undefined, new ToggleReleaseError(data?.reason ?? "UNKNOWN", data?.errorCode)];
```

Update `ToggleReleaseError` to carry `reason` and optional `errorCode` instead of a free-text message.

### 6. Update tests
**File:** `apps/daemon/src/hono/HonoApplication.test.ts`

- Update existing 422 assertions to verify response shape includes `reason` (already tested)
- Add test for `SymlinkCreationFailed` verifying `errorCode` is present with a valid `LinkerErrorCode` value
- Add test for `PartialDisableFailure` on disable
- Verify no raw error messages or file paths appear in response bodies

### 7. Regenerate OpenAPI schema
**File:** `apps/daemon/openapi.schema.json`

Run schema generation — the new `errorCode` field will appear as optional in the spec, serving as documentation for client developers building localisation mappings.

## Error Code Reference (for client localisation)

| `reason` | `errorCode` | User-actionable meaning |
|---|---|---|
| `ReleaseNotFound` | — | The mod/release no longer exists |
| `ReleaseNotReady` | — | Download/extraction is still in progress |
| `DropzoneModsDirNotConfigured` | — | Dropzone mods directory needs to be configured in settings |
| `DcsPathNotConfigured` | — | DCS installation path needs to be configured in settings |
| `SymlinkCreationFailed` | `SOURCE_NOT_FOUND` | Mod files are missing — try re-downloading |
| `SymlinkCreationFailed` | `LINK_ALREADY_EXISTS` | A conflicting file/mod already exists at the destination |
| `SymlinkCreationFailed` | `PERMISSION_DENIED` | Insufficient permissions — run as administrator |
| `SymlinkCreationFailed` | `LINK_CREATION_FAILED` | General failure creating mod link |
| `PartialDisableFailure` | — | Some mod files could not be removed during disable |

## Verification

1. Run existing tests: `bun test` in `apps/daemon` and `packages/linker`
2. Verify new tests pass for `errorCode` presence on `SymlinkCreationFailed`
3. Verify no response body contains raw file paths or error messages (only structured codes)
4. Regenerate OpenAPI schema and verify `errorCode` appears as optional field
5. Check webapp reads `reason` + `errorCode` correctly

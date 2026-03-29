# Bug 004 — UAC Denial Still Shows "Mod Enabled" Success in UI

## Summary

When enabling a mod that requires a UAC (User Account Control) elevation prompt to create a symbolic link, clicking **"No"** on the UAC dialog still results in the UI displaying a success notification ("Mod Enabled"). The symlink is **not** actually created, so the mod is not truly enabled, but the user is given no indication of failure.

## Severity

**High** — The user is shown misleading feedback. The mod appears enabled but is non-functional, leading to confusion when DCS doesn't load the expected mod files.

## Steps to Reproduce

1. Install a mod that has symbolic links targeting a different drive volume than the Dropzone mods folder (cross-volume file symlink scenario).
2. Click "Enable" on the mod in the UI.
3. A Windows UAC prompt appears requesting elevated permissions.
4. Click **"No"** to deny the elevation.
5. Observe the UI shows a success notification: "Mod Enabled".

## Expected Behaviour

The UI should display an error notification indicating that the mod could not be enabled because the user denied the elevation prompt.

## Actual Behaviour

The UI displays a success notification even though the symlink creation failed and the mod is not actually enabled.

## Root Cause Analysis

The bug is caused by **three layered issues** across the webapp client command and the daemon service:

### Layer 1 (Primary) — `apps/webapp/src/ui/commands/ToggleReleaseById.ts`

The `enableRelease()` client function uses a custom fetch wrapper (`packages/clients/src/createFetchClient.ts`) that **never rejects the Promise on HTTP error responses**. It always resolves with `{ status, data }`, even for 422 or 500 status codes.

```typescript
// ToggleReleaseById.ts — lines 40-42
return await enableRelease(releaseId)
    .then((): Ok<"Enabled", never> => ok("Enabled"))       // ← ALWAYS fires, even on 500
    .catch((e): Err<never, ToggleReleaseError> => err(...)); // ← only fires on network errors
```

The `.then()` callback **unconditionally returns `ok("Enabled")`** without inspecting the HTTP status code of the response. The `.catch()` only handles network-level failures (e.g., daemon unreachable), not HTTP error responses (422/500).

The same issue exists for the `disableRelease()` call on lines 35-37.

### Layer 2 (Secondary) — `apps/daemon/src/application/services/ReleaseToggle.ts`

The `enable()` method calls `ensureSymlink()` without a try/catch:

```typescript
// ReleaseToggle.ts — line 42
await this.deps.fileSystem.ensureSymlink(srcAbs, destAbs);
```

The `LocalFileSystem.ensureSymlink()` adapter **throws** an `Error` when `mklink()` returns a failure Result (e.g., UAC denied → PowerShell exits non-zero → `mklink` returns `err`). Since `ReleaseToggle.enable()` doesn't catch this exception, the returned `Promise<Result<void, PathResolverError>>` **rejects** instead of resolving with an `err(...)` Result. This violates the project's Result-based error handling convention.

### Layer 3 (Tertiary) — `apps/daemon/src/hono/HonoApplication.ts`

The Hono route handler only checks the resolved Result for errors, but doesn't handle a rejected promise:

```typescript
// HonoApplication.ts — lines 414-423
const result = await c.var.app.enableRelease(releaseId);
if (result.isErr()) {
    return c.json({ error: result.error.type, code: 422 }, 422);
}
return c.json({ ok: true }, 200);
```

When `enableRelease()` rejects (due to the uncaught throw in Layer 2), Hono's global `jsonErrorTransformer` catches it and returns a 500 response. This works, but it's an unintended fallthrough rather than explicit error handling.

## Error Propagation Flow

```
User denies UAC
  → PowerShell exits non-zero
  → runPowerShellElevated() returns err(...)
  → createSymlinkElevated() returns err(...)
  → mklink() returns err([LinkCreationFailed, message])
  → LocalFileSystem.ensureSymlink() throws Error        ← Layer 2: not caught
  → ReleaseToggle.enable() promise rejects               ← Layer 2: should return err Result
  → HonoApplication handler: unhandled rejection         ← Layer 3: no try/catch
  → Hono global error handler returns HTTP 500
  → Client fetch resolves with { status: 500, data }     ← never rejects
  → ToggleReleaseById .then() fires                      ← Layer 1: doesn't check status
  → Returns ok("Enabled")
  → UI shows success notification                        ← BUG
```

## Affected Files

| File | Issue |
|---|---|
| `apps/webapp/src/ui/commands/ToggleReleaseById.ts` | `.then()` doesn't check response status code |
| `apps/daemon/src/application/services/ReleaseToggle.ts` | `ensureSymlink()` throw not caught; should return `err` Result |
| `apps/daemon/src/hono/HonoApplication.ts` | Enable handler lacks try/catch for rejected promise |
| `apps/daemon/src/application/ports/FileSystem.ts` | `ensureSymlink` returns `Promise<void>` — should return `Promise<Result<...>>` to align with project conventions |

## Suggested Fix

### Fix 1 — `ToggleReleaseById.ts` (webapp command) — Check response status

Replace the `.then()/.catch()` pattern with status-code-aware handling:

```typescript
const response = await enableRelease(releaseId);
if (response.status !== StatusCodes.OK) {
    return err(new ToggleReleaseError(response.data?.error ?? "Failed to enable release"));
}
return ok("Enabled");
```

Apply the same fix to the `disableRelease()` call.

### Fix 2 — `ReleaseToggle.ts` (daemon service) — Catch symlink failure

Wrap the `ensureSymlink` call in a try/catch and return a proper `err` Result:

```typescript
try {
    await this.deps.fileSystem.ensureSymlink(srcAbs, destAbs);
} catch (e) {
    logger.error(`Failed to create symlink for linkId ${link.id}: ${e}`);
    return err(new SymlinkCreationFailed(link.id, String(e)));
}
```

### Fix 3 (Optional) — `FileSystem` port — Return Result instead of throwing

Change the `ensureSymlink` port signature to return `Promise<Result<void, Error>>` instead of `Promise<void>`, aligning with the project's neverthrow conventions and making error handling explicit at the type level.


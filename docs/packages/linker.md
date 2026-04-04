# Linker API

**Stable**

The **Linker API** provides an interface for creating and removing symbolic links on disk. It handles platform-specific symlink strategies (junctions, hard links, symbolic links, and UAC elevation on Windows) and returns structured, actionable errors using [`neverthrow`](https://github.com/supermacro/neverthrow) `Result` types.

The package lives at `packages/linker` and is published internally as `@packages/linker`.

## Interfaces

### `Linker`

The `Linker` class is the primary entry point. Instantiate it directly — there are no configuration options.

```ts
import { Linker } from "@packages/linker";

const linker = new Linker();
```

#### `Linker.enable()`

Creates symbolic links for all provided [`LinkDefinition`](#linkdefinition) objects. If any link fails, all previously created links are rolled back and the error for the failing link is returned.

##### Syntax

```ts
linker.enable(links: LinkDefinition[]): Promise<Result<ResolvedLink[], SymlinkCreationFailed>>
```

##### Parameters

`links`
:   An array of [`LinkDefinition`](#linkdefinition) objects describing the symlinks to create. Each entry must specify an absolute source path (`src`) and an absolute destination path (`dest`).

##### Return value

A `Promise` that resolves to a `Result`:

- **`ok(ResolvedLink[])`** — All symlinks were created. The resolved array contains one [`ResolvedLink`](#resolvedlink) per input entry with the `id`, `src`, and `dest` that were used.
- **`err(SymlinkCreationFailed)`** — One link failed. Previously created links are rolled back. The error identifies the failing link via `linkId` and includes a machine-readable [`LinkerErrorCode`](#linkererrorcode).

##### Exceptions

No exceptions are thrown. All errors are returned as `Result` values.

##### Description

For each link definition, `enable()`:

1. Checks that the source path exists on disk. Returns `SourceNotFound` if not.
2. Creates any missing parent directories for the destination path.
3. Checks that the destination path does not already exist. Returns `LinkAlreadyExists` if it does.
4. Calls the underlying [`mklink`](#mklink) function to create the appropriate link type for the platform.
5. On failure, all previously created links are cleaned up before returning the error.

On Windows, `mklink` automatically selects the most appropriate link strategy:

| Target type | Volumes | Strategy |
|---|---|---|
| Directory | Any | NTFS junction |
| File | Same volume | Hard link |
| File | Cross-volume | Symbolic link (with UAC elevation if `EPERM`) |

On Unix, all links are created as symbolic links.

##### Examples

```ts
import { Linker } from "@packages/linker";
import { LinkerErrorCode } from "@packages/linker";

const linker = new Linker();

const result = await linker.enable([
  {
    id: "my-mod-script",
    src: "/path/to/mod/release/Scripts/myMod.lua",
    dest: "/path/to/dcs/Saved Games/Scripts/myMod.lua",
  },
]);

result.match(
  (resolved) => {
    console.log(`Created ${resolved.length} symlink(s)`);
  },
  (error) => {
    switch (error.code) {
      case LinkerErrorCode.SourceNotFound:
        console.error(`Source file missing for link '${error.linkId}'`);
        break;
      case LinkerErrorCode.PermissionDenied:
        console.error(`Permission denied — try running as administrator`);
        break;
      default:
        console.error(`Symlink creation failed: ${error.message}`);
    }
  },
);
```

---

#### `Linker.disable()`

Removes symlinks from disk. All links are attempted regardless of individual failures. Returns both the successfully removed IDs and structured error information for any failures.

##### Syntax

```ts
linker.disable(
  links: { id: string; installedPath: string }[]
): Result<string[], { removed: string[]; failed: RemovalFailed[] }>
```

##### Parameters

`links`
:   An array of objects, each with:
    - `id` — The identifier of the link.
    - `installedPath` — The absolute path where the symlink was created.

##### Return value

A `Result` (synchronous — no `Promise`):

- **`ok(string[])`** — All links were removed. The array contains the `id` of every successfully removed link.
- **`err({ removed, failed })`** — At least one removal failed.
  - `removed: string[]` — IDs of links that were successfully removed.
  - `failed: RemovalFailed[]` — Structured errors for links that could not be removed. Each entry exposes the `linkId` and a `message`.

Links whose `installedPath` does not exist on disk are treated as already removed and included in the `removed` list.

##### Exceptions

No exceptions are thrown. All errors are returned as `Result` values.

##### Examples

```ts
const result = linker.disable([
  { id: "my-mod-script", installedPath: "/path/to/dcs/Saved Games/Scripts/myMod.lua" },
]);

if (result.isOk()) {
  console.log(`Removed ${result.value.length} symlink(s)`);
} else {
  const { removed, failed } = result.error;
  console.log(`Removed ${removed.length}, failed ${failed.length}`);
  for (const f of failed) {
    console.warn(`Could not remove '${f.linkId}': ${f.message}`);
  }
}
```

---

### `mklink()`

Low-level function used internally by `Linker.enable()`. Creates a single symbolic or hard link based on the platform and the relationship between the source and destination paths. Prefer using `Linker.enable()` rather than calling `mklink()` directly.

##### Syntax

```ts
mklink(options: { link: string; target: string }): Promise<Result<ExitCodes, [ExitCodes, string]>>
```

---

## Types

### `LinkDefinition`

Describes a symlink to be created.

```ts
type LinkDefinition = {
  /** Unique identifier for this link, used in error reporting */
  id: string;
  /** Absolute path to the symlink target (the real file or directory) */
  src: string;
  /** Absolute path where the symlink will be created */
  dest: string;
};
```

---

### `ResolvedLink`

Returned by [`Linker.enable()`](#linkerenabled) on success. Carries the absolute paths that were used.

```ts
type ResolvedLink = {
  /** Identifier from the original LinkDefinition */
  id: string;
  /** Absolute source path */
  src: string;
  /** Absolute destination path */
  dest: string;
};
```

---

## Errors

### `SymlinkCreationFailed`

Extends `Error`. Returned when [`Linker.enable()`](#linkerenabled) cannot create a symlink.

```ts
class SymlinkCreationFailed extends Error {
  readonly type: "SymlinkCreationFailed";
  /** The ID of the link that failed (from the LinkDefinition) */
  readonly linkId: string;
  /** Machine-readable code for actionable user feedback */
  readonly code: LinkerErrorCode;
}
```

---

### `RemovalFailed`

Extends `Error`. Returned inside the `failed` array when [`Linker.disable()`](#linkerdisable) cannot remove a symlink.

```ts
class RemovalFailed extends Error {
  readonly type: "RemovalFailed";
  /** The ID of the link that could not be removed */
  readonly linkId: string;
}
```

---

### `LinkerErrorCode`

An enum of machine-readable codes carried by [`SymlinkCreationFailed`](#symlinkCreationfailed). Map these to user-facing messages.

```ts
enum LinkerErrorCode {
  /** The destination path already exists on disk */
  LinkAlreadyExists = "LINK_ALREADY_EXISTS",
  /** The source (target) path does not exist on disk */
  SourceNotFound    = "SOURCE_NOT_FOUND",
  /** The process lacks permission to create the symlink (e.g. UAC elevation denied) */
  PermissionDenied  = "PERMISSION_DENIED",
  /** General failure — see the error message for details */
  LinkCreationFailed = "LINK_CREATION_FAILED",
}
```

#### Recommended user messages

| Code | Suggested user feedback |
|---|---|
| `LINK_ALREADY_EXISTS` | "A file already exists at the destination. Remove it manually and try again." |
| `SOURCE_NOT_FOUND` | "The mod file could not be found. Try re-downloading the mod." |
| `PERMISSION_DENIED` | "Permission denied. On Windows, try running DCS Dropzone as Administrator." |
| `LINK_CREATION_FAILED` | "An unexpected error occurred while creating the link. Check the logs for details." |

---

## Platform support

| Feature | Windows | Linux / macOS |
|---|---|---|
| Directory links | NTFS junction | Symbolic link |
| Same-volume file links | Hard link | Symbolic link |
| Cross-volume file links | Symbolic link (UAC if needed) | Symbolic link |
| Elevated permission retry | ✅ (PowerShell `Start-Process -Verb RunAs`) | ✗ |

---

## See Also

- [Enable Release](/daemon/spec/enable-release) — How the Daemon uses `Linker.enable()` during mod activation.
- [Disable Release](/daemon/spec/disable-release) — How the Daemon uses `Linker.disable()` during mod deactivation.
- [`neverthrow` documentation](https://github.com/supermacro/neverthrow) — The `Result` type used throughout this API.

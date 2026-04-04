# How the Daemon works

This guide explains how the Daemon manages the full lifecycle of a [mod](#) on the user's machine — from receiving an install request to making the mod active in DCS World. It covers the download and extraction pipeline, how [symlinks](#) are used to activate mods, how [mission scripts](#) are managed, and what each release status means. Familiarity with the concepts of mods and releases from the [Webapp](#) is assumed.

## What the Daemon is

The Daemon is a background process that runs locally on the user's machine alongside DCS World. It exposes a local HTTP API that the [Webapp](#) and [Launcher](#) use to issue commands. Users do not interact with the Daemon directly — they interact through the Webapp UI, which forwards requests to the Daemon.

The Daemon is stateful. It maintains a local record of every release it has been asked to manage, including the current download and extraction progress for each asset, whether symlinks are in place, and which releases are enabled.

## Release states

At any point a release tracked by the Daemon is in one of the following states:

| State | Meaning |
|---|---|
| `PENDING` | The release has been registered and assets are queued for download |
| `IN_PROGRESS` | Assets are actively being downloaded or extracted |
| `DISABLED` | All assets are downloaded and extracted; the mod is not active in DCS World |
| `ENABLED` | All assets are ready and symlinks are in place; the mod is active in DCS World |
| `INCONSISTENT` | The release is marked as enabled but one or more expected symlinks are missing from disk |
| `ERROR` | One or more assets failed to download or extract |

## The installation pipeline

When the user requests installation of a release, the Daemon processes each asset through a two-stage pipeline: download then extract.

### Download stage

The Daemon downloads each asset URL to a local folder reserved for that release. Downloads are queued and processed sequentially per asset. Progress is tracked per-download and aggregated into an overall percentage that the UI can display.

Assets with multiple URLs — for example a mod that ships separate files for different DCS versions — are each downloaded independently.

### Extract stage

For assets marked as archives, an extract job is queued automatically after the download completes. Extraction runs only once all downloads for the release have finished. Non-archive assets are used as-is.

Once all download and extract jobs for a release are complete, the release enters the `DISABLED` state. Its files are fully present on disk and it is ready to be enabled.

> **Note:** If the Daemon is restarted mid-download, it resumes processing any incomplete jobs on next startup. No data is lost and no re-queuing is needed.

## Enabling a mod

Enabling a release creates [symlinks](#) in the DCS World directories so that DCS World can find the mod's files on launch.

Each release carries a list of symlink definitions sourced from the [registry](#). Each definition specifies a source path within the extracted release files and a destination path in one of two root locations:

- **DCS saved games directory** — for most mods: aircraft liveries, campaigns, and missions
- **DCS installation directory** — for mods that modify core DCS World files

The Daemon resolves each definition to absolute paths and creates the symlinks. If any symlink cannot be created — for example because the configured DCS path is wrong or the Daemon lacks write permission — the enable operation fails and the release stays in its previous state.

After all symlinks are created, the Daemon rebuilds two auxiliary files that are described below.

## Disabling a mod

Disabling a release removes the symlinks that were created when it was enabled. The Daemon tracks the installed path of each symlink so it knows exactly what to remove. Once the symlinks are gone, DCS World will no longer load the mod.

After removing symlinks, the Daemon rebuilds the same auxiliary files updated during enable.

> **Note:** Disabling a mod does not delete any downloaded files. The release remains in the `DISABLED` state and can be re-enabled at any time without re-downloading.

## Mission scripting files

Some releases include mission scripts — Lua scripts that extend DCS World's mission scripting engine. The Daemon manages two aggregated files that DCS World reads on mission start, one for scripts that run before sanitization and one for scripts that run after.

Whenever a release is enabled or disabled, the Daemon regenerates both files from scratch based on the full set of currently enabled releases. This ensures the files always reflect the current enabled state and never contain references to mods that have been disabled.

## The remove-symlinks script

In addition to the mission scripting files, the Daemon maintains a utility script that removes all symlinks currently managed by DCS Dropzone. This script is regenerated on every enable and disable operation alongside the mission scripting files.

The script is intended as a recovery tool — it allows a user to cleanly remove all DCS Dropzone symlinks from their DCS World directories without running the Daemon, for example when uninstalling DCS Dropzone.

## The INCONSISTENT state

A release is `INCONSISTENT` when the Daemon's records show it as enabled but one or more of its symlinks are not present on disk. This can happen if:

- A symlink was manually deleted outside of DCS Dropzone
- The [saved games directory](#) was moved or recreated after the mod was enabled
- DCS World or another tool removed the file

An inconsistent release will not function correctly in DCS World. To resolve it, disable the release and re-enable it. This causes the Daemon to remove any remaining symlinks and recreate all of them from scratch.

## Configuration requirements

The Daemon will not install or enable any release until two paths are configured:

- **Mods directory** — where downloaded and extracted release files are stored
- **DCS installation path** — the root of the DCS World installation, used to resolve symlink destinations in the DCS installation directory

The saved games directory path is derived from the DCS installation path. If either path is missing or incorrect, install and enable operations return an error immediately without modifying any files.

## See Also

- [How the Webapp works](/guides/how-the-webapp-works) — How release metadata, assets, and symlink definitions are published to the registry.
- [Enable Release](/daemon/spec/enable-release) — Spec page for the enable behavior.
- [Add Release](/daemon/spec/add-release) — Spec page for the download and extract behavior.

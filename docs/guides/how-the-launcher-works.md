# How the Launcher works

This guide explains what the Launcher does, how it keeps DCS Dropzone up to date, and how it hands off to the [Daemon](#) after updates are applied. Familiarity with the general structure of DCS Dropzone — the [Daemon](#), [Webapp](#), and Launcher — is assumed.

## What the Launcher is

The Launcher is the entry point users run when they open DCS Dropzone. It is a lightweight desktop process whose only job is to make sure the Daemon executable is up to date before starting it. Users install the Launcher once; from that point on it silently manages all future application updates.

The Launcher itself is distributed as an installer. Once installed it appears as a desktop shortcut and start menu entry under "DCS Dropzone". Running it always performs the same sequence: check for updates, apply if needed, then start the Daemon.

## The update sequence

Every time the Launcher runs it follows the same steps in order:

1. **Fetch the latest manifest** from a remote URL. The manifest describes the current published release: a version identifier, an etag hash, a creation timestamp, and a list of files included in the release archive.
2. **Compare with the installed manifest.** The Launcher reads the local manifest file from disk. If there is no local manifest — for example on first launch — the Launcher treats this as a fresh install and proceeds to download.
3. **Decide whether an update is needed.** An update is applied if either of the following is true:
   - The remote manifest's etag differs from the local manifest's etag, meaning a new version has been published.
   - Any file listed in the installed manifest is missing from disk, meaning the local installation is incomplete or corrupted.
4. **Download and extract the release archive.** The Launcher fetches the archive from its configured URL, extracts every file into a folder named after the release version, and writes them to disk.
5. **Clean up the previous version.** If an older version folder exists, it is deleted after the new version is fully extracted.
6. **Write the updated manifest.** The local manifest is overwritten with the remote manifest data so that the next launch can compare against it.

If the comparison in step 3 determines that no update is needed — the etag matches and all files exist — steps 4 through 6 are skipped entirely and the Launcher proceeds directly to starting the Daemon.

> **Note:** If the remote manifest cannot be fetched — for example because the machine is offline — the Launcher halts and prompts the user. It does not fall back to launching an older version.

## Starting the Daemon

After updates are resolved, the Launcher starts the Daemon executable from the extracted release folder. The Daemon runs as a child process and inherits the Launcher's console output. The Launcher passes the path to the local database file as an environment variable so the Daemon can find its persistent state.

Once the Daemon is running, the Launcher's work is done. It remains alive only as the parent process — it performs no further actions.

## The manifest

The manifest is a small JSON file that acts as the source of truth for what version is installed. It contains:

| Field | Purpose |
|---|---|
| `etag` | A SHA-256 hash that uniquely identifies the release. Used to detect whether a new version is available |
| `createdAt` | Timestamp of when the release was built |
| `files` | A list of file paths included in the release archive. Used to verify the local installation is complete |
| `__version` | Optional human-readable version string |

Both the remote server and the local disk hold a copy of this manifest. The Launcher compares the two to decide whether an update is needed.

## Installation and uninstallation

The Launcher is packaged as a Windows installer that places the Launcher executable in the user's local application data directory. No administrator privileges are required. The installer optionally creates a desktop shortcut.

On uninstall, the installer runs a cleanup script that removes all files managed by DCS Dropzone in the application directory, including downloaded Daemon versions and the local manifest.

> **Warning:** Uninstalling DCS Dropzone via the system installer removes the application files but does not remove symlinks that the Daemon created in DCS World directories. To clean those up first, use the remove-symlinks script described in [How the Daemon works](/guides/how-the-daemon-works).

## See Also

- [How the Daemon works](/guides/how-the-daemon-works) — What the Daemon does after the Launcher starts it.
- [How the Webapp works](/guides/how-the-webapp-works) — The hosted application where users discover mods.
- [Mod lifecycle overview](/guides/mod-lifecycle) — End-to-end flow from discovery to active mod in DCS World.

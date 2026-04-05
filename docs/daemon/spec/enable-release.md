# Enable Release

**Stable**

Enabling a [release](#) activates the [mod](#) in DCS World by creating [symlinks](#) from the release's files into the DCS World directories and registering any bundled [mission scripts](#) with the mission scripting engine.

| Property      | Value                                                                           |
|---------------|---------------------------------------------------------------------------------|
| Applies to    | Daemon                                                                          |
| Trigger       | User requests that a downloaded release be made active in DCS World             |
| Preconditions | The release has been added and all download and extract jobs have completed      |

## Inputs

`releaseId`
:   **String, required.** The identifier of the release to enable.

### Assertions

| Assertion | Status |
|-----------|--------|
| The release must exist in the Daemon's local store | <Badge type="tip" text="Implemented" /> |
| The release must be ready — all download and extract jobs must have completed | <Badge type="tip" text="Implemented" /> |
| The mods directory must be configured and exist on disk | <Badge type="tip" text="Implemented" /> |
| The DCS path must be configured for each symlink destination root referenced by the release | <Badge type="tip" text="Implemented" /> |

### Outputs

`Result<void, ReleaseToggleError>`
:   On success, returns `void`. On failure, returns one of the following error types:

`ReleaseNotFound`
:   The release does not exist in the Daemon's local store.

`ReleaseNotReady`
:   The release has incomplete download or extract jobs.

`DropzoneModsDirNotConfigured`
:   The mods directory has not been configured or does not exist on disk.

`DcsPathNotConfigured`
:   The DCS path required to resolve symlink destinations has not been configured.

`SymlinkCreationFailed`
:   A symlink could not be created on disk. The error includes the identifier of the symlink that failed.

### Effects

| Effect | Status |
|--------|--------|
| Symlinks are created on disk in the DCS World directories | <Badge type="tip" text="Implemented" /> |
| The installed path of each created symlink is recorded in the Daemon's local store | <Badge type="tip" text="Implemented" /> |
| The release is marked as enabled in the Daemon's local store | <Badge type="tip" text="Implemented" /> |
| `Scripts/DropzoneMissionScriptsBeforeSanitize.lua` is rebuilt to include before-sanitize mission scripts from this release | <Badge type="tip" text="Implemented" /> |
| `Scripts/DropzoneMissionScriptsAfterSanitize.lua` is rebuilt to include after-sanitize mission scripts from this release | <Badge type="tip" text="Implemented" /> |
| `removeSymlinks.bat` is rebuilt to include the newly created symlinks | <Badge type="tip" text="Implemented" /> |
| On failure, all changes are rolled back | <Badge type="tip" text="Implemented" /> |

## Behavior

```mermaid
flowchart TD
    Start([enable releaseId]) --> Exists{Release exists?}

    Exists -- No --> ErrNotFound([Reject: ReleaseNotFound])
    Exists -- Yes --> Ready{Release ready?}

    Ready -- No --> ErrNotReady([Reject: ReleaseNotReady])
    Ready -- Yes --> Loop[For each symlink definition]

    Loop --> ResolveSrc{Resolve source path<br/>from release directory}

    ResolveSrc -- Mods dir not configured --> ErrModsDir([Reject: DropzoneModsDirNotConfigured])
    ResolveSrc -- OK --> ResolveDest{Resolve destination path<br/>from destRoot}

    ResolveDest -- DCS path not configured --> ErrDcsPath([Reject: DcsPathNotConfigured])
    ResolveDest -- "destRoot = saved games" --> CreateLinkSG[Create symlink in<br/>saved games directory]
    ResolveDest -- "destRoot = DCS install" --> CreateLinkDCS[Create symlink in<br/>DCS installation directory]

    CreateLinkSG --> LinkOk{Symlink created?}
    CreateLinkDCS --> LinkOk

    LinkOk -- No --> FailPartial[Fail: report which symlink<br/>could not be created.<br/>Release NOT marked enabled.<br/>Prior symlinks remain on disk.]
    LinkOk -- Yes --> Record[Record installed path<br/>in local store]

    Record --> More{More symlinks?}
    More -- Yes --> Loop
    More -- No --> MarkEnabled[Mark release as enabled]

    MarkEnabled --> RebuildScripts[Rebuild mission scripting files]
    RebuildScripts --> RebuildBat[Rebuild remove-symlinks script]
    RebuildBat --> Done([Release reaches ENABLED state])

    FailPartial -.-> Rollback[Roll back all changes:<br/>remove created symlinks,<br/>clear installed paths,<br/>rebuild scripts]

    style ErrNotFound fill:#f87171,color:#fff
    style ErrNotReady fill:#f87171,color:#fff
    style ErrModsDir fill:#f87171,color:#fff
    style ErrDcsPath fill:#f87171,color:#fff
    style FailPartial fill:#f87171,color:#fff
    style Rollback fill:#fbbf24,color:#000,stroke-dasharray: 5 5
    style Done fill:#4ade80,color:#000
```

## See Also

- [Disable Release](/daemon/spec/disable-release) — Spec page for deactivating an enabled release.
- [Add Release](/daemon/spec/add-release) — Spec page for downloading a release before it can be enabled.
- [Remove Release](/daemon/spec/remove-release) — Spec page for fully removing a release from the Daemon.
- [How the Daemon works](/guides/how-the-daemon-works) — Guide covering the symlink mechanism and mission scripting files.

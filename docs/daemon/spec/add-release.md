# Add Release

**Stable**

Adding a [release](#) registers it with the [Daemon](#) and begins downloading and extracting its assets so the [mod](#) can later be enabled in DCS World.

| Property      | Value                                                                        |
|---------------|------------------------------------------------------------------------------|
| Applies to    | Daemon                                                                       |
| Trigger       | User requests installation of a release from the [registry](#)              |
| Preconditions | The mods directory is configured and exists on disk                          |

## Inputs

`releaseId`
:   **String, required.** The identifier of the release to add.

`modId`
:   **String, required.** The identifier of the mod the release belongs to.

`modName`
:   **String, required.** The display name of the mod.

`version`
:   **String, required.** The version string of the release.

`assets`
:   **List, required.** The downloadable assets for this release. Each asset includes a name, one or more download URLs, and whether it is an archive that should be extracted after download.

`symbolicLinks`
:   **List, required.** The symlink definitions for this release. Each definition specifies a source path within the release, a destination path, and which DCS World root directory the destination is relative to.

`missionScripts`
:   **List, optional.** Mission script definitions bundled with the release. Each definition specifies a script path, where it should be placed, and when it should run.

`dependencies`
:   **List, optional.** Identifiers of other mods this release depends on.

### Assertions

| Assertion | Status |
|-----------|--------|
| The mods directory must be configured | <Badge type="tip" text="Implemented" /> |
| The mods directory must exist on disk | <Badge type="tip" text="Implemented" /> |

### Outputs

`Result<void, DropzoneModsDirNotConfigured>`
:   On success, returns `void`. On failure, returns the following error type:

`DropzoneModsDirNotConfigured`
:   The mods directory has not been configured or does not exist on disk. No release is recorded.

### Effects

| Effect | Status |
|--------|--------|
| A directory is created in the mods directory for the release | <Badge type="tip" text="Implemented" /> |
| The release, its assets, symlink definitions, and mission scripts are recorded in the Daemon's local store | <Badge type="tip" text="Implemented" /> |
| A download job is queued for each asset URL | <Badge type="tip" text="Implemented" /> |
| For each archive asset, an extract job is queued in `PENDING` state | <Badge type="tip" text="Implemented" /> |
| Extract jobs move to `WAITING` once all downloads complete | <Badge type="tip" text="Implemented" /> |
| On download failure, the failed asset is marked as `ERROR` with an error code and human-readable message | <Badge type="tip" text="Implemented" /> |
| On extraction failure, the failed asset is marked as `ERROR` with an error code and human-readable message | <Badge type="tip" text="Implemented" /> |

## Behavior

```mermaid
flowchart TD
    Start([addRelease data]) --> CheckDir{Mods directory<br/>configured?}

    CheckDir -- No --> ErrModsDir([Reject: DropzoneModsDirNotConfigured])
    CheckDir -- Yes --> ExistsOnDisk{Mods directory<br/>exists on disk?}

    ExistsOnDisk -- No --> ErrModsDir
    ExistsOnDisk -- Yes --> CreateDir[Create release directory]

    CreateDir --> SaveRelease[Record release, assets,<br/>symlinks, mission scripts<br/>in local store]

    SaveRelease --> AssetLoop{More assets?}

    AssetLoop -- No --> Done([Release in PENDING state])
    AssetLoop -- Yes --> QueueDownload[Queue download job<br/>for each URL on asset]

    QueueDownload --> IsArchive{Asset is archive?}

    IsArchive -- Yes --> QueueExtract[Queue extract job<br/>in PENDING state]
    IsArchive -- No --> AssetLoop

    QueueExtract --> AssetLoop

    Done --> Processing[Jobs process asynchronously]

    Processing --> AllDownloads{All downloads<br/>succeeded?}

    AllDownloads -- Yes --> MoveExtracts[Move extract jobs<br/>from PENDING to WAITING]
    AllDownloads -- No --> DownloadFail[Mark failed asset as ERROR<br/>with error code and message]

    DownloadFail --> ReleaseError([Release reaches ERROR state])

    MoveExtracts --> AllExtracts{All extractions<br/>succeeded?}

    AllExtracts -- Yes --> ReleaseReady([Release reaches DISABLED state])
    AllExtracts -- No --> ExtractFail[Mark failed asset as ERROR<br/>with error code and message]

    ExtractFail --> ReleaseError

    style ErrModsDir fill:#f87171,color:#fff
    style DownloadFail fill:#f87171,color:#fff
    style ExtractFail fill:#f87171,color:#fff
    style ReleaseError fill:#f87171,color:#fff
    style ReleaseReady fill:#4ade80,color:#000
    style Done fill:#60a5fa,color:#000
```

## See Also

- [Remove Release](/daemon/spec/remove-release) — Spec page for removing an added release from the Daemon.
- [Enable Release](/daemon/spec/enable-release) — Spec page for activating a release after it reaches the `DISABLED` state.
- [How the Daemon works](/guides/how-the-daemon-works) — Guide covering the download and extraction pipeline.
- [How the Webapp works](/guides/how-the-webapp-works) — How release metadata and assets are published to the registry.

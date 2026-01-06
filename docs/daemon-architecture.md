# Daemon Architecture

## Overview

The **daemon** application (`apps/daemon`) is a local background service that handles downloading, extracting, and installing DCS World mods. It runs on the user's machine and communicates with the webapp through a REST API.

The daemon uses a **Ports & Adapters** (Hexagonal Architecture) pattern to separate business logic from infrastructure concerns, making it testable and maintainable.

## Architecture Pattern

The daemon follows the **Ports & Adapters** pattern:

- **Application Core**: Contains business logic, independent of infrastructure
- **Ports**: Interfaces defining contracts (e.g., `DownloadProcessor`, `ExtractProcessor`, `FileSystem`)
- **Adapters**: Concrete implementations of ports (e.g., `WgetDownloadProcessor`, `SevenZipExtractProcessor`, `LocalFileSystem`)

This separation allows the daemon to:
- Swap implementations easily (e.g., different download tools)
- Test business logic without external dependencies
- Keep infrastructure details isolated

## Key Components

### Application Layer

The `Application` class is the core of the daemon:

```
Application (abstract)
└── ProdApplication (concrete implementation)
    ├── Services
    │   ├── ReleaseCatalog - Manages mod releases
    │   ├── ReleaseToggle - Enables/disables releases
    │   ├── ReleaseAssetManager - Coordinates downloads & extractions
    │   ├── PathResolver - Resolves file paths
    │   └── MissionScriptingFilesManager - Manages DCS mission scripts
    └── Ports (injected dependencies)
        ├── DownloadProcessor
        ├── ExtractProcessor
        ├── ReleaseRepository
        ├── AttributesRepository
        ├── JobRecordRepository
        └── FileSystem
```

### Services

**ReleaseCatalog**: Tracks all releases managed by the daemon
- Adds/removes releases
- Reports status of each release and its assets

**ReleaseToggle**: Manages release activation
- Enables releases by creating symbolic links
- Disables releases by removing symbolic links

**ReleaseAssetManager**: Coordinates download and extraction jobs
- Creates download jobs for release assets
- Creates extraction jobs that depend on download completion
- Tracks progress of all jobs
- Uses the `@packages/queue` library for job management

**PathResolver**: Resolves file system paths
- Release folders
- Asset download locations
- Symbolic link destinations

**MissionScriptingFilesManager**: Manages DCS mission scripting files
- Generates and updates mission scripts
- Handles script injection for mods

### Ports (Interfaces)

**DownloadProcessor**: Interface for downloading files
- Current implementation: `WgetDownloadProcessor`

**ExtractProcessor**: Interface for extracting archives
- Current implementation: `SevenZipExtractProcessor`

**ReleaseRepository**: Interface for release persistence
- Current implementation: `DrizzleReleaseRepository` (SQLite via Drizzle ORM)

**AttributesRepository**: Interface for key-value storage
- Current implementation: `DrizzleAttributesRepository`

**JobRecordRepository**: Interface for job queue persistence
- Current implementation: `DrizzleJobRecordRepository`

**FileSystem**: Interface for file operations
- Current implementation: `LocalFileSystem`

**UUIDGenerator**: Interface for generating unique IDs
- Production uses `crypto.randomUUID()`

### Adapters (Implementations)

Located in `apps/daemon/src/adapters/`:

- **WgetDownloadProcessor**: Uses wget for resumable downloads
- **SevenZipExtractProcessor**: Uses 7-Zip for archive extraction
- **DrizzleReleaseRepository**: SQLite persistence via Drizzle ORM
- **DrizzleAttributesRepository**: Key-value storage
- **DrizzleJobRecordRepository**: Job queue storage
- **LocalFileSystem**: Node.js file system operations

## Job Queue System

The daemon uses the `@packages/queue` library for managing download and extraction jobs. See:
- [Download Queue System](./download-queue-system.md)
- [Extract Queue System](./extract-queue-system.md)

The `ReleaseAssetManager` coordinates these queues:
1. Creates download jobs for each asset URL
2. Creates extraction jobs in PENDING state
3. When all downloads complete, moves extraction jobs to WAITING state
4. Queue processes extraction jobs automatically

## REST API

The daemon exposes a REST API via Hono (`HonoApplication` in `apps/daemon/src/hono/`):

### Endpoints

**POST /api/downloads**
- Adds a release to the daemon
- Body: `ModAndReleaseData` (mod + release info)
- Creates download and extraction jobs

**GET /api/downloads**
- Lists all releases managed by daemon
- Returns: Array of `ModAndReleaseData` with status

**DELETE /api/downloads/:releaseId**
- Removes a release from daemon
- Cancels pending jobs and cleans up files

**POST /api/toggle/:releaseId/enable**
- Enables a release by creating symbolic links

**POST /api/toggle/:releaseId/disable**
- Disables a release by removing symbolic links

**GET /api/health**
- Health check endpoint
- Returns daemon status and instance ID

### OpenAPI Documentation

The daemon automatically generates OpenAPI documentation available at:
- `/api` - Scalar UI for interactive API exploration
- `/v3/api-docs` - OpenAPI specification

## Terminal User Interface (TUI)

The daemon includes an optional Terminal User Interface built with `@opentui/core` and `@opentui/react`. The TUI displays:
- Active releases and their status
- Download/extraction progress
- Real-time job updates

Enable/disable TUI in `config.toml`:
```toml
[app]
tui_enabled = true
```

## Configuration

The daemon is configured via `config.toml` in its working directory. See `config.dist.toml` for a template.

**Configuration Sections:**

```toml
[dcs]
dcs_working_dir = "%USERPROFILE%/Saved Games/DCS"
dcs_install_dir = "C:/Program Files/Eagle Dynamics/DCS World"

[binaries]
wget = "bin/wget.exe"
sevenzip = "bin/7za.exe"

[server]
host = "127.0.0.1"
port = 3001

[app]
mods_dir = "./mods"
tui_enabled = true

[database]
url = "index.sqlite"
```

## Persistence

The daemon uses **SQLite** via **Drizzle ORM** for persistence:

- **Releases**: Stored releases and their assets
- **Jobs**: Job queue state (downloads and extractions)
- **Attributes**: Key-value store (e.g., daemon instance ID)

Database schema is managed with Drizzle migrations:
```bash
bun run drizzle  # Generate migrations
```

## Communication with Webapp

The webapp communicates with the daemon via HTTP:

1. User clicks "Download" in webapp
2. Webapp sends POST to daemon's `/api/downloads`
3. Daemon creates jobs and returns
4. Webapp polls GET `/api/downloads` for status updates
5. User sees real-time progress in webapp UI

The daemon's instance ID ensures the webapp talks to the correct daemon instance.

## Development Workflow

**Running the Daemon:**
```bash
cd apps/daemon
bun run dev  # Development mode with hot reload
```

**Building Executable:**
```bash
cd apps/daemon
bun run build  # Creates standalone executable
```

**Testing:**
```bash
cd apps/daemon
bun test
```

**Type Checking:**
```bash
cd apps/daemon
bun run check  # Runs Biome linter and TypeScript
```

## Key Design Decisions

1. **Ports & Adapters Pattern**: Separates business logic from infrastructure for testability
2. **Single Queue Instance**: Uses `@packages/queue` for coordinated job processing
3. **Job Dependencies**: Extract jobs wait for download completion via event listeners
4. **Resumable Downloads**: wget allows partial download resume after failures/crashes
5. **Symbolic Links**: Mods are enabled/disabled via symlinks, avoiding file duplication
6. **Local Database**: SQLite ensures all state survives restarts
7. **REST API**: Standard HTTP allows webapp integration and potential future integrations

## Related Documentation

- [Command-Query Pattern](./command-query-pattern.md) - Webapp server architecture (different from daemon)
- [Download Queue System](./download-queue-system.md) - Download job details
- [Extract Queue System](./extract-queue-system.md) - Extraction job details
- [`@packages/queue` README](../packages/queue/README.md) - Job queue library

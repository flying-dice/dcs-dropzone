# Persistent Download Queue System

## Overview

The download queue system provides a robust, database-backed solution for managing file downloads with automatic retry, crash recovery, and resumable downloads. The database is the single source of truth, ensuring downloads can survive application restarts without data loss.

## Architecture

### Components

1. **DownloadQueue** - Main service that manages the queue
   - Polls database for pending jobs every second
   - Processes one download at a time (single-job concurrency)
   - Handles retry logic with fixed 30-second delay
   - Resumes any in-progress jobs on startup
   - No event emitters (jobs are tracked via database status)

2. **spawnWget** - Child process function for wget
   - Validates inputs with Zod schema
   - Uses `-c` flag for resumable downloads
   - Parses progress from stderr
   - Handles wget exit codes
   - Supports AbortSignal for cancellation
   - Returns Result type (neverthrow) for error handling

3. **DOWNLOAD_QUEUE** - Database table
   - Tracks job state, progress, retry metadata
   - Single source of truth for all download operations

## Usage

### Basic Usage

```typescript
import Application from "./daemon/Application.ts";

// The download queue is automatically started on application launch
const { downloadQueue } = Application;

// Enqueue a new download
downloadQueue.pushJob(
  'release-123',           // releaseId
  'asset-456',             // releaseAssetId
  'download-789',          // unique job id
  'https://example.com/file.zip',  // url
  '/downloads'             // targetDirectory
);
```

### Cancel Jobs

Cancel all download jobs for a specific release:

```typescript
// Cancel all jobs for a release
downloadQueue.cancelJobsForRelease('release-123');
```

### Checking Job Status

Query the database directly to check job status:

```typescript
import { db } from "./daemon/database";
import { T_DOWNLOAD_QUEUE } from "./daemon/database/schema.ts";
import { eq } from "drizzle-orm";

// Get all jobs for a release
const jobs = db
  .select()
  .from(T_DOWNLOAD_QUEUE)
  .where(eq(T_DOWNLOAD_QUEUE.releaseId, 'release-123'))
  .all();

console.log(`Found ${jobs.length} download jobs`);
```

## Job Lifecycle

### Status Flow

```
PENDING → IN_PROGRESS → COMPLETED
              ↓ (on failure)
           PENDING (retry after 30s, up to maxAttempts)
```

When a download fails (e.g., network error, wget process error), the job returns to `PENDING` status with an incremented `attempt` counter. The job will be retried after 30 seconds. Once `attempt` reaches `maxAttempts`, the job remains in `PENDING` but won't be picked up again.

### States

- **PENDING**: Job is queued, waiting to be processed or waiting for retry
- **IN_PROGRESS**: Job is actively downloading
- **COMPLETED**: Download finished successfully

## Child Process: spawnWget

### Function Signature

```typescript
async function spawnWget(
  props: SpawnWgetProps,
  abortSignal?: AbortSignal
): Promise<Result<string, WgetErrors>>
```

### Props Validation (Zod)

```typescript
const SpawnWgetProps = z.object({
  exePath: z.string(),   // Path to wget executable
  target: z.string(),    // Target directory for download
  url: z.url(),          // URL to download
  onProgress: z.function(),  // Progress callback
});
```

### Error Types

```typescript
enum WgetErrors {
  PropsError = "PropsError",     // Invalid input props
  ProcessError = "ProcessError", // wget process failed
}
```

### Wget Exit Codes

| Code | Meaning |
|------|---------|
| 0 | No problems occurred |
| 1 | Generic error code |
| 2 | Parse error — invalid command line options |
| 3 | File I/O error |
| 4 | Network failure |
| 5 | SSL verification failure |
| 6 | Authentication failure |
| 7 | Protocol error |
| 8 | Server issued an error response |

## Resilience Features

### 1. Crash Recovery

On startup, the download queue automatically:
- Resumes any jobs stuck in `IN_PROGRESS` state
- Respects retry count limits

### 2. Resumable Downloads

- Uses wget's `-c` (continue) flag
- Partial downloads are automatically resumed
- No need to restart from byte zero

### 3. Retry with Fixed Delay

Failed downloads retry after 30 seconds:
- Job status returns to `PENDING`
- `attempt` counter increments
- `nextAttemptAfter` set to 30 seconds in future

### 4. Cancellation Support

- Active jobs can be cancelled via AbortController
- All jobs for a release can be cancelled at once
- Cancelled jobs are deleted from the database

## Configuration

Configure the download queue in `Application.ts`:

```typescript
const downloadQueue = new DownloadQueue({
  db: _db,
  wgetExecutablePath: applicationConfig.binaries.wget,
});
```

The `maxAttempts` is stored per-job in the database (default: 3).

## Database Schema

### DOWNLOAD_QUEUE Table

```sql
CREATE TABLE DOWNLOAD_QUEUE (
  -- Identity
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  release_asset_id TEXT NOT NULL,
  
  -- Download Location
  url TEXT NOT NULL,
  target_directory TEXT NOT NULL,
  
  -- State Management
  status TEXT NOT NULL DEFAULT 'PENDING',
  
  -- Progress Tracking
  progress_percent INTEGER NOT NULL DEFAULT 0,
  
  -- Retry Metadata
  attempt INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_attempt_after INTEGER NOT NULL,
  
  -- Audit
  created_at INTEGER NOT NULL,
  
  -- Foreign Keys
  FOREIGN KEY (release_id) REFERENCES MOD_RELEASES(release_id),
  FOREIGN KEY (release_asset_id) REFERENCES MOD_RELEASE_ASSETS(id)
);
```

## Integration Points

The download queue is used by daemon API endpoints and commands to enqueue download jobs for mod releases. Jobs are created when:

- A mod release is enabled/subscribed
- Assets need to be downloaded for installation

Example of creating download jobs:

```typescript
// Create download jobs for each asset URL
for (const [idx, url] of asset.urls.entries()) {
  downloadQueue.pushJob(
    releaseId,
    asset.id,
    `${asset.id}:${idx}`,
    url,
    targetDirectory
  );
}
```

## Testing

Run the test suite:

```bash
bun test
```

## Troubleshooting

### Downloads not starting

1. Verify wget executable path in `config.toml`
2. Check database for jobs stuck in `IN_PROGRESS`
3. Verify job hasn't exceeded `maxAttempts`

### Jobs failing immediately

- Verify URL is accessible
- Check wget executable permissions
- Review error logs for specific wget exit codes

## Related Documentation

- [Extract Queue System](./extract-queue-system.md) - Companion extraction queue

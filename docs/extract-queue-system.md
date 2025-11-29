# Persistent Extract Queue System

## Overview

The extract queue system provides a robust, database-backed solution for managing archive extraction with automatic retry, crash recovery, and dependency tracking. The database is the single source of truth, ensuring extractions can survive application restarts without data loss.

This system works in tandem with the [Download Queue System](./download-queue-system.md) - extract jobs only begin once all their dependent download jobs are completed.

## Architecture

### Components

1. **ExtractQueue** - Main service that manages the extraction queue
   - Polls database for pending jobs
   - Manages single-job concurrency (one extraction at a time)
   - Handles retry logic with fixed delay (30 seconds)
   - Performs crash recovery on startup
   - Waits for all dependent downloads to complete before starting

2. **spawnSevenzip** - Child process function for 7zip
   - Validates inputs with Zod schema
   - Parses progress from stdout/stderr
   - Handles 7zip exit codes
   - Supports AbortSignal for cancellation
   - Returns Result type (neverthrow) for error handling

3. **EXTRACT_QUEUE** - Database table
   - Tracks job state, progress, retry metadata
   - Single source of truth for all extraction operations

4. **EXTRACT_DOWNLOAD_JOIN** - Join table
   - Links extract jobs to their dependent download jobs
   - Ensures extractions only start when all downloads complete

## Usage

### Basic Usage

```typescript
import Application from "./daemon/Application.ts";

// The extract queue is automatically started on application launch
const { extractQueue } = Application;

// Enqueue a new extraction (typically done by ReleaseAssetService)
extractQueue.pushJob(
  'release-123',           // releaseId
  'asset-456',             // releaseAssetId  
  'extract-789',           // unique job id
  '/downloads/archive.7z', // archivePath
  '/extracted/output',     // targetDirectory
  ['download-1', 'download-2']  // dependent download job IDs
);

// Check progress for a release
const progress = extractQueue.getOverallProgressForRelease('release-123');
console.log(`Extraction progress: ${progress}%`);
```

### Cancel Jobs

```typescript
// Cancel all extract jobs for a release
extractQueue.cancelJobsForRelease('release-123');
```

### Event Handling

```typescript
import { ExtractQueueEvents } from "./daemon/queues/ExtractQueue.ts";

// Listen for extraction events
extractQueue.on(ExtractQueueEvents.PUSH, (job) => {
  console.log(`New extract job queued: ${job.id}`);
});

extractQueue.on(ExtractQueueEvents.EXTRACTED, (job) => {
  console.log(`Extraction completed: ${job.extractedPath}`);
});

extractQueue.on(ExtractQueueEvents.FAILED, (job) => {
  console.log(`Extraction failed: ${job.id}, attempt ${job.attempt}`);
});

extractQueue.on(ExtractQueueEvents.CANCELLED, (jobs) => {
  console.log(`Cancelled ${jobs.length} jobs`);
});
```

## Job Lifecycle

### Status Flow

```
PENDING → IN_PROGRESS → COMPLETED
              ↓ (on failure)
           PENDING (retry after 30s, up to maxAttempts)
```

When extraction fails (e.g., corrupt archive, 7zip process error), the job returns to `PENDING` status with an incremented `attempt` counter. The job will be retried after 30 seconds. Once `attempt` reaches `maxAttempts`, the job remains in `PENDING` but won't be picked up again.

### States

- **PENDING**: Job is queued, waiting for dependent downloads to complete or waiting for retry
- **IN_PROGRESS**: Job is actively extracting
- **COMPLETED**: Extraction finished successfully

### Dependency Check

Before an extract job can start:
1. All linked download jobs in `EXTRACT_DOWNLOAD_JOIN` must exist
2. All linked download jobs must have status `COMPLETED`
3. The extract job must have `status = PENDING`
4. The extract job must have `attempt < maxAttempts`
5. The extract job must have `nextAttemptAfter <= now()`

## Child Process: spawnSevenzip

### Function Signature

```typescript
async function spawnSevenzip(
  props: SpawnSevenzipProps,
  abortSignal?: AbortSignal
): Promise<Result<string, SevenzipErrors>>
```

### Props Validation (Zod)

```typescript
const SpawnSevenzipProps = z.object({
  exePath: z.string(),      // Path to 7z executable
  archivePath: z.string(),  // Path to archive file
  targetDir: z.string(),    // Output directory
  onProgress: z.function(), // Progress callback
});
```

### Error Types

```typescript
enum SevenzipErrors {
  PropsError = "PropsError",     // Invalid input props
  ProcessError = "ProcessError", // 7zip process failed
}
```

### 7zip Exit Codes

| Code | Meaning |
|------|---------|
| 0 | No error |
| 1 | Warning (Non fatal error(s)) |
| 2 | Fatal error |
| 7 | Command line error |
| 8 | Not enough memory |
| 255 | User stopped the process |

## Database Schema

### EXTRACT_QUEUE Table

```sql
CREATE TABLE EXTRACT_QUEUE (
  -- Identity
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  release_asset_id TEXT NOT NULL,
  
  -- Paths
  archive_path TEXT NOT NULL,
  target_directory TEXT NOT NULL,
  
  -- State Management
  status TEXT NOT NULL DEFAULT 'PENDING',
  
  -- Progress Tracking
  progress_percent INTEGER DEFAULT 0,
  
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

### EXTRACT_DOWNLOAD_JOIN Table

```sql
CREATE TABLE EXTRACT_DOWNLOAD_JOIN (
  id TEXT PRIMARY KEY,
  extract_job_id TEXT NOT NULL,
  download_job_id TEXT NOT NULL,
  
  FOREIGN KEY (extract_job_id) REFERENCES EXTRACT_QUEUE(id),
  FOREIGN KEY (download_job_id) REFERENCES DOWNLOAD_QUEUE(id)
);
```

## Configuration

Configure the extract queue in `Application.ts`:

```typescript
const extractQueue = new ExtractQueue({
  db: _db,
  sevenzipExecutablePath: applicationConfig.binaries.sevenzip,
  maxRetries: 3,  // Default max retries per job
});
```

## Supported Archive Formats

7zip supports extraction of many archive formats. The actual format support depends on your 7zip installation. Common formats include:
- 7z
- bzip2
- gzip
- lzma
- lzma86
- tar
- xz
- zip
- zstd

For a complete list, see the [7zip documentation](https://documentation.help/7-Zip/formats.htm).

## Resilience Features

### 1. Crash Recovery

On startup, the extract queue automatically:
- Resumes any jobs stuck in `IN_PROGRESS` state
- Respects retry count limits

### 2. Download Dependency Tracking

- Extract jobs won't start until ALL dependent downloads are `COMPLETED`
- Uses database join with `notExists` subquery for efficient checking
- Supports multipart archives (multiple download jobs → single extract job)

### 3. Retry with Fixed Delay

Failed extractions retry after 30 seconds:
- Job status returns to `PENDING`
- `attempt` counter increments
- `nextAttemptAfter` set to 30 seconds in future

### 4. Cancellation Support

- Active jobs can be cancelled via AbortController
- All jobs for a release can be cancelled at once
- Properly cleans up join table entries

## Integration with ReleaseAssetService

The `ReleaseAssetService` automatically creates extract jobs when downloading archive assets:

```typescript
// In ReleaseAssetService.downloadAndExtractReleaseAssets()
if (asset.isArchive && asset.urls.length > 0) {
  const downloadJobIds = asset.urls.map((_, idx) => `${asset.id}:${idx}`);
  
  this.extractQueue.pushJob(
    releaseId,
    asset.id,
    `extract:${asset.id}`,
    archivePath,
    targetDirectory,
    downloadJobIds
  );
}
```

## Testing

Run the test suite:

```bash
bun test src/daemon/queues/ExtractQueue.test.ts
bun test src/daemon/child_process/sevenzip.test.ts
```

## Troubleshooting

### Extractions not starting

1. Check all dependent downloads are `COMPLETED`:
```sql
SELECT dq.id, dq.status 
FROM DOWNLOAD_QUEUE dq
JOIN EXTRACT_DOWNLOAD_JOIN edj ON dq.id = edj.download_job_id
WHERE edj.extract_job_id = 'your-extract-job-id';
```

2. Verify 7zip executable path in `config.toml`
3. Check job hasn't exceeded `maxAttempts`

### Jobs failing immediately

- Verify archive file exists at `archivePath`
- Check 7zip executable permissions
- Review error logs for specific exit codes

### High memory usage

7zip processes archives one at a time to limit resource consumption. Memory usage depends on:
- Archive size and compression method
- Available system memory
- 7zip's internal dictionary size

For archives larger than available RAM, 7zip may use disk-based processing which is slower but functional. No specific file size limits are enforced by the queue system.

## Related Documentation

- [Download Queue System](./download-queue-system.md) - Companion download queue
- [Database Migrations](../README.md#database-migrations-daemon) - Schema management

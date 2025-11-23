# Persistent Download Queue System

## Overview

The download queue system provides a robust, database-backed solution for managing file downloads with automatic retry, crash recovery, and resumable downloads. The database is the single source of truth, ensuring downloads can survive application restarts without data loss.

## Architecture

### Components

1. **DownloadQueueOrchestrator** - Main service that manages the queue
   - Polls database for pending jobs
   - Manages concurrency (default: 3 concurrent downloads)
   - Handles retry logic with exponential backoff
   - Performs crash recovery on startup

2. **BaseProcess** - Abstract class for process management
   - Enforces one-instance-per-job
   - Automatic cleanup and deregistration
   - Cancellation support

3. **WgetProcess** - Concrete wget implementation
   - Uses `-c` flag for resumable downloads
   - Parses progress from stderr
   - Handles wget exit codes

4. **DOWNLOAD_QUEUE** - Database table
   - Tracks job state, progress, retry metadata
   - Single source of truth for all download operations

## Usage

### Basic Usage

```typescript
import Application from "./daemon/Application.ts";

// The orchestrator is automatically started on application launch
const { downloadQueueOrchestrator } = Application;

// Enqueue a new download
const jobId = downloadQueueOrchestrator.enqueueDownload(
  'https://example.com/large-file.zip',
  './downloads'
);

// Check job status
const job = downloadQueueOrchestrator.getJobStatus(jobId);
console.log(`Status: ${job?.status}, Progress: ${job?.progressPercent}%`);
```

### Advanced Usage

```typescript
// Enqueue with custom retry limit
const jobId = downloadQueueOrchestrator.enqueueDownload(
  'https://example.com/file.zip',
  './downloads',
  { maxRetries: 5 }
);

// Cancel a running download
await downloadQueueOrchestrator.cancelJob(jobId);

// Stop the orchestrator (e.g., on application shutdown)
await downloadQueueOrchestrator.stop();

// Restart the orchestrator
await downloadQueueOrchestrator.start();
```

## Job Lifecycle

### Status Flow

```
PENDING → PROCESSING → COMPLETED
           ↓
        RETRYING (with exponential backoff)
           ↓
        FAILED (after max retries)
```

### States

- **PENDING**: Job is queued, waiting to be processed
- **PROCESSING**: Job is actively downloading
- **RETRYING**: Job failed but will retry after backoff delay
- **COMPLETED**: Download finished successfully
- **FAILED**: Download failed permanently after max retries

## Resilience Features

### 1. Crash Recovery (Zombie Sweep)

On startup, the orchestrator automatically:
- Finds all jobs stuck in PROCESSING state
- Resets them to RETRYING or FAILED based on retry count
- Allows downloads to resume from where they left off

### 2. Resumable Downloads

- Uses wget's `-c` (continue) flag
- Partial downloads are automatically resumed
- No need to restart from byte zero

### 3. Exponential Backoff

Failed downloads retry with increasing delays:
- 1st retry: 2 seconds
- 2nd retry: 4 seconds
- 3rd retry: 8 seconds
- etc.

Formula: `initialDelay * 2^retryCount`

### 4. Progress Throttling

- Progress updates are throttled to 500ms intervals
- Reduces database write load
- Still provides real-time progress visibility

### 5. Concurrent Download Limit

- Default: 3 concurrent downloads
- Prevents overwhelming network/disk
- Configurable via orchestrator config

## Configuration

Configure the orchestrator in `Application.ts`:

```typescript
const downloadQueueOrchestrator = new DownloadQueueOrchestrator({
  db: _db,
  wgetExecutablePath: applicationConfig.binaries.wget,
  logger: Logger.getLogger("DownloadQueueOrchestrator"),
  maxConcurrentDownloads: 3,    // Max parallel downloads
  pollIntervalMs: 1000,          // Poll frequency (ms)
  maxRetries: 3,                 // Default max retries per job
  initialRetryDelayMs: 2000,     // Base retry delay (ms)
});
```

## Database Schema

### DOWNLOAD_QUEUE Table

```sql
CREATE TABLE DOWNLOAD_QUEUE (
  -- Identity & Location
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  target_directory TEXT NOT NULL,
  filename TEXT,
  
  -- State Management
  status TEXT NOT NULL DEFAULT 'PENDING',
  
  -- Progress Tracking
  progress_percent INTEGER DEFAULT 0,
  progress_summary TEXT,
  
  -- Retry Metadata
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at INTEGER,
  
  -- Process Management
  pid INTEGER,
  
  -- Audit
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## Monitoring

### Check Active Downloads

```typescript
const activeCount = BaseProcess.getActiveProcessCount();
const activeJobIds = BaseProcess.getActiveJobIds();
console.log(`${activeCount} downloads in progress:`, activeJobIds);
```

### Query Job Status

```typescript
const job = downloadQueueOrchestrator.getJobStatus(jobId);
if (job) {
  console.log(`
    Status: ${job.status}
    Progress: ${job.progressPercent}%
    Retries: ${job.retryCount}/${job.maxRetries}
    PID: ${job.pid || 'N/A'}
  `);
}
```

## Error Handling

### Network Failures

Network failures trigger automatic retry with exponential backoff. The job will retry up to `maxRetries` times before marking as FAILED.

### Application Crashes

On restart, the zombie sweep detects orphaned jobs and resets them for retry. Downloads resume from last checkpoint via wget's `-c` flag.

### Process Cancellation

```typescript
// Cancel specific job
const cancelled = await downloadQueueOrchestrator.cancelJob(jobId);

// Cancel via BaseProcess (lower level)
const cancelled = await BaseProcess.cancelJob(jobId);
```

## Best Practices

1. **Always await orchestrator.start()** on application initialization
2. **Call orchestrator.stop()** during graceful shutdown
3. **Don't delete download queue records** - they're needed for crash recovery
4. **Monitor failed jobs** - they may indicate persistent network issues
5. **Use appropriate maxRetries** based on file importance and network reliability

## Testing

Run the test suite:

```bash
bun test src/daemon/processes/BaseProcess.test.ts
```

All tests should pass with >99% code coverage.

## Troubleshooting

### Downloads not starting

- Check orchestrator is running: `orchestrator.isRunning`
- Verify wget executable path in config
- Check database for jobs stuck in PROCESSING

### High database write load

- Increase `progressThrottleMs` in orchestrator code
- Reduce poll frequency (`pollIntervalMs`)

### Jobs failing immediately

- Verify URL is accessible
- Check wget executable permissions
- Review error logs for specific wget exit codes

## Future Enhancements

Potential improvements for future iterations:

- [ ] Priority queue support
- [ ] Bandwidth throttling
- [ ] Multiple source URLs (mirrors)
- [ ] Hash verification after download
- [ ] UI for monitoring active downloads
- [ ] Metrics/statistics collection

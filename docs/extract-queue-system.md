# Extract Queue System

## Overview

The extract queue manages archive extraction with automatic retry, crash recovery, and dependency tracking. Extraction jobs only start after all required downloads complete successfully.

## How It Works

The extract queue:
- Processes one extraction at a time
- Waits for all dependent downloads to complete
- Automatically retries failed extractions (30 second delay, 3 attempts)
- Recovers in-progress jobs after crashes
- Supports multipart archives

## Job States

Jobs progress through these states:

```
PENDING → IN_PROGRESS → COMPLETED
              ↓ (on failure)
           PENDING (retry after 30s)
```

- **PENDING**: Waiting for downloads or waiting to retry
- **IN_PROGRESS**: Currently extracting
- **COMPLETED**: Successfully extracted

## Key Features

### Download Dependency Tracking
Extract jobs automatically wait until all required downloads are complete before starting.

### Automatic Retry
Failed extractions are automatically retried up to 3 times with a 30-second delay between attempts.

### Crash Recovery
On startup, any jobs stuck in progress are automatically resumed.

### Cancellation
Extractions can be cancelled individually or by release.

### Multipart Archives
Supports archives split across multiple files by tracking download job dependencies.

## Supported Formats

7zip supports many archive formats including:
- 7z, zip, tar
- gzip, bzip2, xz, zstd
- lzma, lzma86

The available formats depend on your 7zip installation.

## Configuration

The 7zip executable path is configured in `config.toml`:

```toml
[binaries]
sevenzip = "binaries/7za.exe"
```

## Troubleshooting

**Extractions not starting:**
- Verify all dependent downloads completed successfully
- Check 7zip executable path in `config.toml`
- Verify the job hasn't exceeded max retry attempts
- Check logs for errors

**Extractions failing:**
- Verify the archive file exists and isn't corrupted
- Check 7zip executable permissions
- Review error codes in logs

**High memory usage:**
- 7zip processes one archive at a time to limit resource usage
- Memory usage depends on archive size and compression method
- Large archives may use disk-based processing

## Related Documentation

- [Download Queue System](./download-queue-system.md) - Downloads that feed into extraction

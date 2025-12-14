# Download Queue System (Daemon)

## Overview

The download queue in the **daemon** application (`apps/daemon`) manages file downloads with automatic retry, crash recovery, and resumable downloads. All state is stored in the database, ensuring downloads survive application restarts.

## How It Works

The download queue:
- Processes one download at a time
- Automatically retries failed downloads (30 second delay)
- Resumes partial downloads using wget
- Recovers in-progress jobs after crashes

## Job States

Jobs progress through these states:

```
PENDING → IN_PROGRESS → COMPLETED
              ↓ (on failure)
           PENDING (retry after 30s)
```

- **PENDING**: Waiting to start or waiting to retry
- **IN_PROGRESS**: Currently downloading
- **COMPLETED**: Successfully downloaded

## Key Features

### Automatic Retry
Failed downloads are automatically retried with a 30-second delay between attempts.

### Resumable Downloads
Partial downloads are resumed from where they left off using wget's continue flag.

### Crash Recovery
On startup, any jobs stuck in progress are automatically resumed.

### Cancellation
Downloads can be cancelled individually or by release.

## Configuration

The wget executable path is configured in the daemon's `config.toml` (`apps/daemon/config.toml`):

```toml
[binaries]
wget = "binaries/wget.exe"
```

## Troubleshooting

**Downloads not starting:**
- Check wget executable path in `apps/daemon/config.toml`
- Check logs for errors

**Downloads failing:**
- Verify the URL is accessible
- Check wget executable permissions
- Review error codes in logs

## Related Documentation

- [Extract Queue System](./extract-queue-system.md) - Archive extraction after downloads

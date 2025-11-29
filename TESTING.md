# Testing Guide

This document outlines the testing strategy for DCS Dropzone, including automated tests and manual regression testing procedures.

## Automated Tests

### Running Tests

```bash
# Run all tests
bun test

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test src/daemon/queues/DownloadQueue.test.ts

# Run tests matching a pattern
bun test --test-name-pattern "DownloadQueue"
```

### Test Organization

Tests are organized following the pattern of keeping unit tests local to the files they test:

```
src/
├── common/
│   ├── MongoUrl.ts
│   ├── MongoUrl.test.ts          # Unit tests for MongoUrl
│   ├── Result.ts
│   ├── Result.test.ts            # Unit tests for Result
│   ├── TypedEventEmitter.ts
│   ├── TypedEventEmitter.test.ts # Unit tests for TypedEventEmitter
│   ├── sha256.ts
│   └── sha256.test.ts            # Unit tests for sha256
├── daemon/
│   ├── api/
│   │   └── health.ts             # Tested via tests/daemon/health.test.ts
│   ├── child_process/
│   │   ├── sevenzip.ts
│   │   └── sevenzip.test.ts      # Unit tests for sevenzip spawning
│   ├── database/
│   │   ├── app-database.ts
│   │   ├── app-database.test.ts  # Unit tests for database migrations
│   │   ├── app-database-migration.ts
│   │   └── app-database-migration.test.ts
│   ├── functions/
│   │   ├── extract-percentage.ts
│   │   ├── extract-percentage.test.ts
│   │   ├── posixpath.ts
│   │   └── posixpath.test.ts
│   ├── queues/
│   │   ├── DownloadQueue.ts
│   │   ├── DownloadQueue.test.ts # Unit tests for download queue
│   │   ├── ExtractQueue.ts
│   │   └── ExtractQueue.test.ts  # Unit tests for extract queue
│   └── repositories/
│       └── impl/
│           ├── DrizzleSqliteSubscriptionRepository.ts
│           └── DrizzleSqliteSubscriptionRepository.test.ts
tests/
└── daemon/
    └── health.test.ts            # Integration test for health API
```

### Writing New Tests

- Place unit tests in the same directory as the source file with `.test.ts` suffix
- Place integration/E2E tests in the `tests/` directory
- Use `bun:test` for all tests
- Follow existing patterns for database setup using in-memory SQLite

#### Conventions (read this before writing tests)
- Prefer local TestClasses (simple test doubles) over framework mocks. Implement just the methods you need, record state, and assert on that state.
- Favor plain objects/arrays over `Map` in tests unless key-ordering or non-string keys are required.
- For services constructed via factories, create a closure-based factory that records `callCount` and `last*` args; return the test double (cast only at the boundary if the real type is a concrete class).
- When testing release lifecycle operations (subscribe/remove), centralize assertions through `ReleaseAssetService` expectations; do not directly assert queue cancellations in unrelated tests.

Example test structure:

```typescript
import { describe, expect, it } from "bun:test";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { AppDatabase } from "../database/app-database.ts";
import { ddlExports } from "../database/db-ddl.ts";

describe("YourFeature", () => {
  function setupTestDb() {
    const appDb = AppDatabase.withMigrations(":memory:", ddlExports);
    return drizzle({ client: appDb.getDatabase() });
  }

  it("should do something", () => {
    const db = setupTestDb();
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

## Manual Regression Testing Plan

This section outlines the manual testing procedure that should be followed for all changes to ensure core functionality remains intact.

### Prerequisites

1. **Environment Setup**
   - Bun v1.3.1 or later installed
   - MongoDB running (for web application)
   - wget and 7zip binaries available at paths specified in `config.toml`

2. **Configuration**
   - Create `.env` file for web application (see README.md)
   - Configure `config.toml` for daemon (see README.md)

### Regression Test Checklist

#### 1. Web Application Health Check

```bash
# Start the web application
bun dev

# Verify health endpoint
curl http://localhost:3000/api/health
# Expected: {"status":"UP"}

# Verify API docs accessible
curl http://localhost:3000/v3/api-docs
# Expected: OpenAPI JSON specification
```

#### 2. Daemon Health Check

```bash
# Start the daemon
bun dev:daemon

# Verify health endpoint (port from config.toml)
curl http://localhost:3001/api/health
# Expected: {"status":"UP"}

# Verify API docs accessible
curl http://localhost:3001/v3/api-docs
# Expected: OpenAPI JSON specification
```

#### 3. Subscription Flow (Critical Path)

This is the core functionality that must work after any change:

1. **Start the daemon**
   ```bash
   bun dev:daemon
   ```

2. **Subscribe to a mod release**
   ```bash
   curl -X POST http://localhost:3001/api/subscriptions \
     -H "Content-Type: application/json" \
     -d '{
       "modId": "test-mod",
       "modName": "Test Mod",
       "releaseId": "test-release-1",
       "version": "1.0.0",
       "dependencies": [],
       "assets": [{
         "name": "test-file.zip",
         "urls": ["https://example.com/test.zip"],
         "isArchive": true
       }],
       "symbolicLinks": [],
       "missionScripts": []
     }'
   ```

3. **Verify subscription was created**
   ```bash
   curl http://localhost:3001/api/subscriptions
   # Expected: Array containing the subscription
   ```

4. **Check files exist in filesystem**
   - Verify the target directory (from `config.toml` [binaries].target_directory) contains downloaded files
   - If archive, verify extraction occurred

5. **Unsubscribe**
   ```bash
   curl -X DELETE http://localhost:3001/api/subscriptions/test-release-1
   ```

6. **Verify cleanup**
   ```bash
   curl http://localhost:3001/api/subscriptions
   # Expected: Empty array or without the deleted subscription
   ```

#### 4. Build Verification

```bash
# Build web application
bun run build
# Verify: dist/app exists and is executable

# Build daemon
bun run build:daemon
# Verify: dist/appd exists and is executable
```

#### 5. Linting and Type Checking

```bash
# Run biome linter
bun run biome
# Expected: No errors

# Run TypeScript type check
bun run tsc
# Expected: No errors
```

### Quick Smoke Test

For quick validation of changes, run this minimal test sequence:

```bash
# 1. Run all tests
bun test

# 2. Type check
bun run tsc

# 3. Lint
bun run biome

# 4. Start daemon and verify health
bun dev:daemon &
sleep 3
curl http://localhost:3001/api/health
kill %1
```

### Common Issues

#### Circular Dependency Errors

If you see "Cannot access 'X' before initialization":
- Check for circular imports between modules
- Consider restructuring imports or using lazy loading

#### Database Migration Errors

If migrations fail:
- Delete the SQLite database file and restart
- Check `src/daemon/database/ddl/` for migration SQL files
- Verify migrations are properly exported in `db-ddl.ts`

#### Download/Extract Queue Not Processing

- Check wget/7zip paths in `config.toml` are correct
- Verify binaries have execute permissions
- Check database for jobs stuck in `IN_PROGRESS` state

### Test Coverage Goals

Aim for:
- **Unit tests**: 90%+ line coverage for business logic
- **Integration tests**: Cover all API endpoints
- **E2E tests**: Cover critical user flows (subscription, download, extract)

Current coverage can be viewed by running:
```bash
bun test --coverage
```

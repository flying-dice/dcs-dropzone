# @packages/queue

A lightweight, type-safe job queue library for single-instance Node.js applications. Built with TypeScript and designed using the Ports & Adapters (Hexagonal Architecture) pattern for maximum flexibility.

## Features

- 🚀 **Lightweight & Simple** - No external dependencies for Redis or other message brokers
- 🔄 **Automatic Retries** - Built-in exponential backoff for failed jobs
- 📝 **Type-Safe** - Full TypeScript support with generic job data and results
- 🎯 **Processor-Based** - Register multiple processors for different job types
- 🔌 **Pluggable Storage** - Bring your own persistence layer via ports
- 📊 **Job Tracking** - Complete history of job runs with success/failure tracking
- ⏱️ **Scheduled Jobs** - Schedule jobs to run at specific times
- 🔁 **Progress Updates** - Track job progress with percentage updates

## Architecture: Ports & Adapters

This library follows the **Ports & Adapters** pattern (also known as Hexagonal Architecture), which provides clean separation between business logic and infrastructure concerns.

### Ports (Interfaces)

Ports define the contracts for external dependencies. You can implement these interfaces with your own persistence layer:

- **`JobRepo`** - Interface for job persistence (create, read, update jobs)
- **`RunRepo`** - Interface for run persistence (track job execution history)
- **`ExponentCalculator`** - Interface for retry delay calculation

### Adapters (Implementations)

The library provides ready-to-use in-memory adapters for quick setup:

- **`InMemoryJobRepo`** - In-memory job storage (useful for testing and development)
- **`InMemoryRunRepo`** - In-memory run storage (useful for testing and development)
- **`ExponentialBackoff`** - Exponential backoff retry strategy

You can also implement your own adapters (e.g., using PostgreSQL, MongoDB, Redis, etc.) by implementing the port interfaces.

## Installation

This package is part of the DCS Dropzone monorepo. If you're using it within the monorepo:

```json
{
  "dependencies": {
    "@packages/queue": "workspace:*"
  }
}
```

## Quick Start

### Basic Usage with In-Memory Adapters

```typescript
import { ok, err } from "neverthrow";
import {
  Queue,
  InMemoryJobRepo,
  InMemoryRunRepo,
  ExponentialBackoff,
  type Processor,
} from "@packages/queue";

// 1. Create adapters
const runRepo = new InMemoryRunRepo();
const jobRepo = new InMemoryJobRepo(runRepo);
const exponentCalculator = new ExponentialBackoff({
  baseDelayMs: 1000,    // Start with 1 second delay
  maxDelayMs: 3600000,  // Max 1 hour delay
  multiplier: 2,        // Double the delay each retry
});

// 2. Define a processor for your job type
const emailProcessor: Processor<{ to: string; subject: string }, void> = {
  name: "send-email",
  process: async (data, ctx) => {
    try {
      // Your job logic here
      await sendEmail(data.to, data.subject);
      
      // Optionally report progress
      await ctx.updateProgress(100);
      
      return ok(undefined);
    } catch (error) {
      return err(`Failed to send email: ${error.message}`);
    }
  },
};

// 3. Create the queue with processors
const queue = new Queue(
  { jobRepo, runRepo, exponentCalculator },
  { 
    processors: [emailProcessor],
    pollIntervalMs: 1000, // Check for jobs every second
  }
);

// 4. Start the queue
queue.start();

// 5. Add jobs
const jobId = await queue.add("send-email", {
  to: "user@example.com",
  subject: "Welcome!",
});

// 6. Query job status
const job = await queue.getJob(jobId);
const latestRun = await queue.getLatestRun(jobId);

console.log("Job status:", job?.completedAt ? "completed" : "pending");
console.log("Latest run state:", latestRun?.state);

// 7. Stop the queue when done
queue.stop();
```

### Scheduled Jobs

Schedule jobs to run at a specific time:

```typescript
// Schedule a job to run in 1 hour
const futureDate = new Date(Date.now() + 60 * 60 * 1000);
await queue.add("send-email", { to: "user@example.com" }, futureDate);
```

### Progress Tracking

Track job progress during execution:

```typescript
const processor: Processor<{ items: string[] }, void> = {
  name: "process-items",
  process: async (data, ctx) => {
    const total = data.items.length;
    
    for (let i = 0; i < total; i++) {
      await processItem(data.items[i]);
      
      // Update progress
      const progress = Math.round(((i + 1) / total) * 100);
      await ctx.updateProgress(progress);
    }
    
    return ok(undefined);
  },
};
```

### Handling Job Cancellation

Processors receive an `AbortSignal` for handling cancellation:

```typescript
const processor: Processor<{ url: string }, Buffer> = {
  name: "download",
  process: async (data, ctx) => {
    try {
      const response = await fetch(data.url, {
        signal: ctx.abortSignal, // Pass abort signal to fetch
      });
      
      if (!response.ok) {
        return err(`HTTP ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      return ok(Buffer.from(buffer));
    } catch (error) {
      if (error.name === "AbortError") {
        return err("Download cancelled");
      }
      return err(error.message);
    }
  },
};
```

## Bringing Your Own Persistence

To use a custom persistence layer (e.g., PostgreSQL, MongoDB), implement the port interfaces:

### Example: PostgreSQL Job Repository

```typescript
import type { JobRepo, Job } from "@packages/queue";
import { Pool } from "pg";

export class PostgresJobRepo implements JobRepo {
  constructor(private pool: Pool) {}

  async save(job: Job): Promise<Job> {
    await this.pool.query(
      `INSERT INTO jobs (id, name, data, created_at, scheduled_at, attempts)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         scheduled_at = $5,
         attempts = $6,
         completed_at = EXCLUDED.completed_at,
         progress = EXCLUDED.progress,
         progress_updated_at = EXCLUDED.progress_updated_at`,
      [job.id, job.name, JSON.stringify(job.data), job.createdAt, job.scheduledAt, job.attempts]
    );
    return job;
  }

  async findById(id: string): Promise<Job | undefined> {
    const result = await this.pool.query(
      "SELECT * FROM jobs WHERE id = $1",
      [id]
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : undefined;
  }

  async findNextEligible(name: string): Promise<Job | undefined> {
    const result = await this.pool.query(
      `SELECT * FROM jobs 
       WHERE name = $1 
         AND completed_at IS NULL 
         AND scheduled_at <= NOW()
       ORDER BY scheduled_at ASC
       LIMIT 1`,
      [name]
    );
    return result.rows[0] ? this.mapRow(result.rows[0]) : undefined;
  }

  async updateProgress(id: string, progress: number, progressUpdatedAt: Date): Promise<void> {
    await this.pool.query(
      "UPDATE jobs SET progress = $1, progress_updated_at = $2 WHERE id = $3",
      [progress, progressUpdatedAt, id]
    );
  }

  async markCompleted(id: string, completedAt: Date): Promise<void> {
    await this.pool.query(
      "UPDATE jobs SET completed_at = $1 WHERE id = $2",
      [completedAt, id]
    );
  }

  async incrementAttempts(id: string): Promise<number> {
    const result = await this.pool.query(
      "UPDATE jobs SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts",
      [id]
    );
    return result.rows[0].attempts;
  }

  async reschedule(id: string, attempt: number, scheduledAt: Date): Promise<void> {
    await this.pool.query(
      "UPDATE jobs SET attempts = $1, scheduled_at = $2 WHERE id = $3",
      [attempt, scheduledAt, id]
    );
  }

  async list(name?: string): Promise<Job[]> {
    const query = name
      ? "SELECT * FROM jobs WHERE name = $1 ORDER BY scheduled_at ASC"
      : "SELECT * FROM jobs ORDER BY scheduled_at ASC";
    const result = await this.pool.query(query, name ? [name] : []);
    return result.rows.map(this.mapRow);
  }

  async listPending(name?: string): Promise<Job[]> {
    const query = name
      ? "SELECT * FROM jobs WHERE name = $1 AND completed_at IS NULL ORDER BY scheduled_at ASC"
      : "SELECT * FROM jobs WHERE completed_at IS NULL ORDER BY scheduled_at ASC";
    const result = await this.pool.query(query, name ? [name] : []);
    return result.rows.map(this.mapRow);
  }

  async listCompleted(name?: string): Promise<Job[]> {
    const query = name
      ? "SELECT * FROM jobs WHERE name = $1 AND completed_at IS NOT NULL ORDER BY scheduled_at ASC"
      : "SELECT * FROM jobs WHERE completed_at IS NOT NULL ORDER BY scheduled_at ASC";
    const result = await this.pool.query(query, name ? [name] : []);
    return result.rows.map(this.mapRow);
  }

  private mapRow(row: any): Job {
    return {
      id: row.id,
      name: row.name,
      data: row.data,
      createdAt: row.created_at,
      scheduledAt: row.scheduled_at,
      completedAt: row.completed_at,
      attempts: row.attempts,
      progress: row.progress,
      progressUpdatedAt: row.progress_updated_at,
    };
  }
}
```

Then use it with the Queue:

```typescript
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const jobRepo = new PostgresJobRepo(pool);
const runRepo = new PostgresRunRepo(pool); // Similar implementation
const exponentCalculator = new ExponentialBackoff();

const queue = new Queue(
  { jobRepo, runRepo, exponentCalculator },
  { processors: [myProcessor] }
);
```

### Custom Retry Strategy

Implement your own retry strategy by implementing the `ExponentCalculator` port:

```typescript
import type { ExponentCalculator } from "@packages/queue";

export class LinearBackoff implements ExponentCalculator {
  constructor(private delayMs: number = 1000) {}

  calculate(attempts: number, baseDate?: Date): Date {
    const base = baseDate ?? new Date();
    const delay = this.delayMs * attempts; // Linear: 1s, 2s, 3s, 4s...
    return new Date(base.getTime() + delay);
  }
}
```

## API Reference

### Queue

The main queue class that manages job processing.

#### Constructor

```typescript
new Queue(deps: Deps, options: Opts)
```

**Parameters:**
- `deps.jobRepo`: Implementation of `JobRepo` port
- `deps.runRepo`: Implementation of `RunRepo` port
- `deps.exponentCalculator`: Implementation of `ExponentCalculator` port
- `options.processors`: Array of processors to handle different job types
- `options.pollIntervalMs`: Polling interval in milliseconds (default: 1000)

#### Methods

##### `start()`
Start the queue polling and job processing.

##### `stop()`
Stop the queue polling.

##### `add<TData>(name: string, data: TData, scheduledAt?: Date): Promise<string>`
Add a new job to the queue.

**Returns:** Job ID

##### `getJob(id: string): Promise<Job | undefined>`
Get a job by ID.

##### `getRun(id: string): Promise<Run | undefined>`
Get a run by ID.

##### `getLatestRun(jobId: string): Promise<Run | undefined>`
Get the latest run for a specific job.

##### `getJobRuns(jobId: string): Promise<Run[]>`
Get all runs for a specific job.

##### `listJobs(name?: string): Promise<Job[]>`
List all jobs, optionally filtered by job name.

##### `listPendingJobs(name?: string): Promise<Job[]>`
List pending (not completed) jobs.

##### `listCompletedJobs(name?: string): Promise<Job[]>`
List completed jobs.

##### `listFailedRuns(): Promise<Run[]>`
List all failed runs.

### Types

#### Job

Represents a unit of work.

```typescript
type Job<TData = any> = {
  id: string;                    // Unique identifier
  name: string;                  // Job type name
  data: TData;                   // Job payload
  createdAt: Date;               // When job was created
  scheduledAt: Date;             // When job should run
  completedAt?: Date;            // When job completed
  attempts: number;              // Number of execution attempts
  progress?: number;             // Progress percentage (0-100)
  progressUpdatedAt?: Date;      // When progress was last updated
};
```

#### Run

Represents one execution attempt of a job.

```typescript
type Run<TResult = any> = {
  id: string;                    // Unique identifier
  jobId: string;                 // Associated job ID
  jobName: string;               // Job type name
  attempt: number;               // Attempt number (1-based)
  state: RunState;               // Current state
  startedAt: Date;               // When run started
  endedAt?: Date;                // When run ended
  result?: TResult;              // Result on success
  error?: {                      // Error on failure
    code: RunErrorCode;
    message: string;
  };
};
```

#### RunState

```typescript
enum RunState {
  Running = "running",
  Success = "success",
  Failed = "failed",
}
```

#### Processor

Handles execution of jobs with a specific name.

```typescript
type Processor<TData = any, TResult = any> = {
  name: string;                  // Job type this processor handles
  process: (
    data: TData,
    ctx: ProcessorContext
  ) => Promise<Result<TResult, string>>;
};
```

#### ProcessorContext

Context provided to processor during execution.

```typescript
type ProcessorContext = {
  updateProgress: (progress: number) => Promise<void>;
  abortSignal: AbortSignal;
};
```

### Adapters

#### InMemoryJobRepo

In-memory implementation of `JobRepo`.

```typescript
const jobRepo = new InMemoryJobRepo(runRepo);
```

**Methods:**
- `clear()`: Clear all jobs (useful for testing)

#### InMemoryRunRepo

In-memory implementation of `RunRepo`.

```typescript
const runRepo = new InMemoryRunRepo();
```

**Methods:**
- `clear()`: Clear all runs (useful for testing)

#### ExponentialBackoff

Exponential backoff retry strategy.

```typescript
const calculator = new ExponentialBackoff({
  baseDelayMs: 1000,      // Starting delay (default: 1000)
  maxDelayMs: 3600000,    // Maximum delay (default: 3600000)
  multiplier: 2,          // Exponential multiplier (default: 2)
});
```

**Formula:** `delay = min(baseDelayMs * (multiplier ** (attempts - 1)), maxDelayMs)`

Where `**` is JavaScript's exponentiation operator.

For example, with the default values:
- Attempt 1: 1000ms × 2⁰ = 1 second
- Attempt 2: 1000ms × 2¹ = 2 seconds
- Attempt 3: 1000ms × 2² = 4 seconds
- Attempt 4: 1000ms × 2³ = 8 seconds
- And so on, until maxDelayMs is reached

## Important Notes

### Single-Instance Only

⚠️ **Warning:** This queue is designed for single-instance applications. It does **not** handle distributed locking or multi-instance coordination. If you need to run multiple instances, you must implement your own locking mechanism in your repository adapters, or use a distributed queue system like BullMQ.

### Job Lifecycle

1. **Created** - Job is added to the queue with `scheduledAt` time
2. **Eligible** - Job becomes eligible when `scheduledAt` <= now and not completed
3. **Running** - A processor picks up the job and creates a run
4. **Completed/Failed** - Run finishes with success or failure
5. **Retry** - On failure, job is rescheduled with exponential backoff
6. **Completed** - On success, job is marked as completed

### Error Handling

- Jobs are automatically retried on failure with exponential backoff
- Failed runs are preserved in the run history
- Use `listFailedRuns()` to view error logs
- Processors should return `err(message)` for expected failures
- Unhandled exceptions in processors will be caught and logged

## Examples

### Multi-Step Job with Progress

```typescript
const processor: Processor<{ steps: string[] }, void> = {
  name: "multi-step",
  process: async (data, ctx) => {
    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i];
      
      try {
        await executeStep(step);
        await ctx.updateProgress(Math.round(((i + 1) / data.steps.length) * 100));
      } catch (error) {
        return err(`Step ${i + 1} failed: ${error.message}`);
      }
    }
    
    return ok(undefined);
  },
};
```

### Monitoring Queue Health

```typescript
// Get queue statistics
const pendingJobs = await queue.listPendingJobs();
const completedJobs = await queue.listCompletedJobs();
const failedRuns = await queue.listFailedRuns();

console.log(`Queue Health:
  Pending: ${pendingJobs.length}
  Completed: ${completedJobs.length}
  Failed Runs: ${failedRuns.length}
`);

// Monitor specific job
const jobId = "some-job-id";
const job = await queue.getJob(jobId);
const runs = await queue.getJobRuns(jobId);

console.log(`Job ${jobId}:
  Attempts: ${job?.attempts}
  Progress: ${job?.progress}%
  Total Runs: ${runs.length}
  Last Run: ${runs[runs.length - 1]?.state}
`);
```

## Testing

The library includes utilities for testing:

```typescript
import { describe, it, expect } from "bun:test";
import { ok } from "neverthrow";
import {
  Queue,
  InMemoryJobRepo,
  InMemoryRunRepo,
  ExponentialBackoff,
} from "@packages/queue";

describe("My Job Processor", () => {
  it("should process jobs successfully", async () => {
    // Setup in-memory adapters
    const runRepo = new InMemoryRunRepo();
    const jobRepo = new InMemoryJobRepo(runRepo);
    const exponentCalculator = new ExponentialBackoff({ baseDelayMs: 10 });

    // Create queue with test processor
    const queue = new Queue(
      { jobRepo, runRepo, exponentCalculator },
      { 
        processors: [myProcessor],
        pollIntervalMs: 10, // Fast polling for tests
      }
    );

    // Add and process job
    const jobId = await queue.add("test", { foo: "bar" });
    queue.start();
    
    // Wait for completion (poll until job is completed)
    while (true) {
      const job = await queue.getJob(jobId);
      if (job?.completedAt) break;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    queue.stop();

    // Assert results
    const job = await queue.getJob(jobId);
    expect(job?.completedAt).toBeDefined();
    
    const run = await queue.getLatestRun(jobId);
    expect(run?.state).toBe("success");
  });
});
```

## Contributing

This package is part of the DCS Dropzone monorepo. See the [main README](../../README.md) for contribution guidelines.

## License

This project is private. All rights reserved.

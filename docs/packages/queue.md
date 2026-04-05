# Queue API

**Stable**

The **Queue API** is a lightweight, single-instance job queue library built on the Ports & Adapters pattern. It handles job scheduling, processor dispatch, automatic retry with exponential backoff, progress reporting, and cancellation. All state is managed through the [`JobRecordRepository`](#jobrecordrepository) port, making it straightforward to swap in persistent storage.

The package lives at `packages/queue` and is published internally as `@packages/queue`.

> **Single-instance only.** The queue does not implement distributed locking or multi-instance coordination. Do not use it in environments where multiple processes may consume jobs from the same repository concurrently.

---

## Classes

### `Queue`

The primary entry point. Extends `EventEmitter`. Instantiate it with a `JobRecordRepository` and a list of [`Processor`](#processor) objects, then call `start()` to begin polling.

```ts
import { Queue, InMemoryJobRecordRepository } from "@packages/queue";

const repo = new InMemoryJobRecordRepository();
const queue = new Queue(
  { jobRecordRepository: repo },
  { processors: [myProcessor], pollIntervalMs: 500 },
);

queue.start();
```

#### Constructor

```ts
new Queue(deps: QueueDeps, options: QueueOptions)
```

##### `QueueDeps`

| Property | Type | Description |
|---|---|---|
| `jobRecordRepository` | [`JobRecordRepository`](#jobrecordrepository) | Stores and retrieves job records. |

##### `QueueOptions`

| Property | Type | Default | Description |
|---|---|---|---|
| `processors` | [`Processor[]`](#processor) | — | Processors to register. At least one is required to process jobs. |
| `pollIntervalMs` | `number` | `1000` | How often (ms) the queue polls for eligible jobs. |
| `delayCalculator` | [`DelayCalculator`](#delaycalculator) | `ExponentialDelayCalculator(1000, 60000)` | Controls retry backoff timing. |

---

#### `queue.start()`

Starts the polling loop. Emits [`QueueEvents.Start`](#queueevents).

```ts
queue.start(): void
```

---

#### `queue.stop()`

Stops the polling loop. Emits [`QueueEvents.Stop`](#queueevents). In-flight jobs are not interrupted.

```ts
queue.stop(): void
```

---

#### `queue.add()`

Enqueues a new job and emits [`QueueEvents.Added`](#queueevents). Returns the created [`JobRecord`](#jobrecord).

```ts
queue.add<TData>(
  name: string,
  data: TData,
  initialState?: JobState.Pending | JobState.Waiting,
): JobRecord
```

##### Parameters

`name`
:   The name of the [`Processor`](#processor) that should handle this job.

`data`
:   Arbitrary payload passed to the processor's `process()` method.

`initialState`
:   Initial state for the job. Defaults to `JobState.Waiting`.
    Use `JobState.Pending` to hold a job until [`moveFromPendingToWaiting()`](#queuemovefrompendingtowaiting) is called (useful for sequencing, e.g. holding an extract job until its download completes).

##### Examples

```ts
// Standard job — picked up immediately
const job = queue.add("download", { url: "https://example.com/mod.zip" });

// Deferred job — held until explicitly released
const extractJob = queue.add("extract", { archivePath: "/tmp/mod.zip" }, JobState.Pending);
```

---

#### `queue.moveFromPendingToWaiting()`

Releases a `Pending` job into the `Waiting` state so it becomes eligible for processing. Throws if the job does not exist or is not in `Pending` state.

```ts
queue.moveFromPendingToWaiting(runId: string): void
```

##### Example

```ts
queue.on(QueueEvents.Succeeded, (job) => {
  if (job.processorName === "download") {
    queue.moveFromPendingToWaiting(extractJob.runId);
  }
});
```

---

#### `queue.cancel()`

Cancels a job. If the job is currently running, its [`AbortSignal`](#processorcontext) is triggered. The job is marked `Cancelled` in the repository and [`QueueEvents.Cancelled`](#queueevents) is emitted.

```ts
queue.cancel(job: JobRecord): void
```

---

#### `queue.getByRunId()`

Returns the [`JobRecord`](#jobrecord) for a specific run, or `undefined` if not found.

```ts
queue.getByRunId(runId: string): JobRecord | undefined
```

---

#### `queue.getAllByJobId()`

Returns all runs (including retries) for a logical job.

```ts
queue.getAllByJobId(jobId: string): JobRecord[]
```

---

#### `queue.getLatestByJobId()`

Returns the most recent run for a logical job, or `undefined`.

```ts
queue.getLatestByJobId(jobId: string): JobRecord | undefined
```

---

#### `queue.getAllForProcessor()`

Returns all job records handled by the named processor.

```ts
queue.getAllForProcessor(name: string): JobRecord[]
```

---

#### `queue.on()` — Events

The queue is an `EventEmitter`. Use `queue.on()` to listen to lifecycle events.

| Event | Listener signature | Description |
|---|---|---|
| `QueueEvents.Added` | `(job: JobRecord) => void` | A new job was enqueued. |
| `QueueEvents.Cancelled` | `(job: JobRecord) => void` | A job was cancelled. |
| `QueueEvents.Succeeded` | `(job: JobRecord) => void` | A job completed successfully. |
| `QueueEvents.Failed` | `(failed: JobRecord, rescheduled: JobRecord) => void` | A job failed. If retries remain, a rescheduled record is also provided. |
| `QueueEvents.Progress` | `(job: JobRecord) => void` | A processor reported a progress update. |
| `QueueEvents.Start` | `() => void` | The queue started polling. |
| `QueueEvents.Stop` | `() => void` | The queue stopped polling. |

```ts
queue.on(QueueEvents.Succeeded, (job) => {
  console.log(`Job ${job.jobId} succeeded with result:`, job.result);
});

queue.on(QueueEvents.Failed, (failed, rescheduled) => {
  console.warn(`Job ${failed.jobId} failed. New run: ${rescheduled?.runId}`);
});
```

---

#### `queue.running`

Read-only boolean. `true` when the polling loop is active.

```ts
queue.running: boolean
```

---

### `InMemoryJobRecordRepository`

An in-memory implementation of [`JobRecordRepository`](#jobrecordrepository). Suitable for use in tests and single-process daemon applications where durability is not required.

```ts
import { InMemoryJobRecordRepository } from "@packages/queue";

const repo = new InMemoryJobRecordRepository();
```

All data is lost when the process exits. For persistence across restarts, implement [`JobRecordRepository`](#jobrecordrepository) backed by a database.

---

### `ExponentialDelayCalculator`

The default [`DelayCalculator`](#delaycalculator) implementation. Computes retry delays using the formula `min(baseDelay × 2^(attempt − 1), maxDelay)`.

```ts
import { ExponentialDelayCalculator } from "@packages/queue";

const calculator = new ExponentialDelayCalculator(1000, 60000);
// attempt 1 →  1 000 ms
// attempt 2 →  2 000 ms
// attempt 3 →  4 000 ms
// attempt 4 →  8 000 ms (capped at maxDelay if lower)
```

##### Constructor

```ts
new ExponentialDelayCalculator(baseDelay: number, maxDelay: number)
```

| Parameter | Type | Description |
|---|---|---|
| `baseDelay` | `number` | Initial delay in milliseconds for the first retry. |
| `maxDelay` | `number` | Upper bound in milliseconds. No retry delay will exceed this value. |

---

## Interfaces

### `JobRecordRepository`

The persistence port for job records. Implement this interface to provide custom storage (e.g. SQLite, MongoDB).

```ts
interface JobRecordRepository {
  // Create
  create(record: CreateJobRecord): JobRecord;

  // Read
  findByRunId(runId: string): JobRecord | undefined;
  findAllByJobId(jobId: string): JobRecord[];
  findLatestByJobId(jobId: string): JobRecord | undefined;
  findAllForProcessor(processorName: string): JobRecord[];
  findAllInState(
    state: JobState[],
    opts?: { limit?: number; processorName?: string; excludedJobIds?: string[] },
  ): JobRecord[];

  // Update
  updateProgressForRunId(runId: string, progress: number): void;
  markSuccessForRunId(runId: string, result: any): void;
  markRunningForRunId(runId: string): void;
  markFailedForRunId(runId: string, errorCode: JobErrorCode, errorMessage: string): void;
  markCancelledForRunId(runId: string): void;
  markWaitingForRunId(runId: string): void;
}
```

---

### `Processor`

Implement this interface to handle a specific class of jobs. Register instances with the queue via `QueueOptions.processors`.

```ts
type Processor<TData = any, TResult = any> = {
  /** Unique name identifying the job type this processor handles. */
  name: string;

  /**
   * Executes the job.
   * - Return [result, null] on success.
   * - Return [undefined, reason] on a known failure — the queue will retry.
   */
  process: (job: TData, ctx: ProcessorContext) => Promise<[TResult, null] | [undefined, string]>;
};
```

Each processor handles **one job at a time**. The queue skips a processor's next eligible job until the current one finishes.

##### Example

```ts
import type { Processor, ProcessorContext } from "@packages/queue";

const downloadProcessor: Processor<{ url: string }, { filePath: string }> = {
  name: "download",
  async process(data, ctx) {
    try {
      const filePath = await downloadFile(data.url, {
        onProgress: (pct) => ctx.updateProgress(pct),
        signal: ctx.abortSignal,
      });
      return [{ filePath }, null];
    } catch (e) {
      return [undefined, String(e)];
    }
  },
};
```

---

### `DelayCalculator`

Interface for computing retry delay durations. Implement this to replace the default exponential backoff strategy.

```ts
interface DelayCalculator {
  calculateDelayMs(attempts: number): number;
}
```

`attempts` is the 1-based attempt count (1 on the first retry, 2 on the second, and so on).

---

## Types

### `JobRecord`

Represents the state of a single run of a job. Every retry produces a new `JobRecord` sharing the same `jobId`.

```ts
type JobRecord<TData = any, TResult = any> = {
  /** Logical job identifier — shared across all retries of the same job. */
  jobId: string;
  /** Unique identifier for this specific run. */
  runId: string;
  /** Name of the processor that handles this job. */
  processorName: string;
  /** Data payload passed to the processor. */
  jobData: TData;
  /** Current lifecycle state. */
  state: JobState;
  /** When this run was created. */
  createdAt: Date;
  /** When processing started (set on transition to Running). */
  startedAt?: Date;
  /** When processing finished (set on Success, Failed, or Cancelled). */
  finishedAt?: Date;
  /** Latest progress value (0–100) reported by the processor. */
  progress?: number;
  /** When the progress was last updated. */
  progressUpdatedAt?: Date;
  /** Processor result on success. */
  result?: TResult;
  /** Machine-readable failure code. */
  errorCode?: JobErrorCode;
  /** Human-readable failure message. */
  errorMessage?: string;
};
```

---

### `CreateJobRecord`

Input type for `JobRecordRepository.create()`.

```ts
type CreateJobRecord = {
  /** Provide to attach this run to an existing logical job (e.g. on retry). Omit to generate a new jobId. */
  jobId?: string;
  jobData: any;
  processorName: string;
  initialState: JobState.Waiting | JobState.Pending;
};
```

---

### `ProcessorContext`

Passed to `Processor.process()` during execution.

```ts
type ProcessorContext = {
  /** Report progress (0–100). Triggers a QueueEvents.Progress event on the queue. */
  updateProgress: (progress: number) => void;
  /** Abort signal triggered when queue.cancel() is called for this job. */
  abortSignal: AbortSignal;
};
```

---

## Enums

### `JobState`

Lifecycle states for a job run.

| Value | String | Description |
|---|---|---|
| `JobState.Pending` | `"pending"` | Created but held — not yet eligible for processing. Release with `moveFromPendingToWaiting()`. |
| `JobState.Waiting` | `"waiting"` | Eligible for processing. The queue will dispatch it on the next poll. |
| `JobState.Running` | `"running"` | Currently being processed. |
| `JobState.Success` | `"success"` | Completed successfully. |
| `JobState.Failed` | `"failed"` | Failed after exhausting all retries. |
| `JobState.Cancelled` | `"cancelled"` | Cancelled before or during processing. |

State transitions:

```
Pending ──► Waiting ──► Running ──► Success
                  ▲         │
                  │         ▼
                  └──── Failed (retry)
                             │
                             ▼ (retries exhausted)
                           Failed (terminal)

Running ──► Cancelled
Waiting ──► Cancelled
Pending ──► Cancelled
```

---

### `JobErrorCode`

Machine-readable failure codes set on a `JobRecord` when a run fails.

| Value | String | Description |
|---|---|---|
| `JobErrorCode.ProcessorError` | `"PROCESSOR_ERROR"` | The processor returned `[undefined, reason]`. |
| `JobErrorCode.ProcessorException` | `"PROCESSOR_EXCEPTION"` | The processor's `process()` threw an unhandled exception. |
| `JobErrorCode.JobRunNotFound` | `"JOB_RUN_NOT_FOUND"` | A running record existed in the repository with no matching active `JobRun` — typically caused by an unexpected restart. |

---

### `QueueEvents`

Event names emitted by the `Queue`. Use these with `queue.on()`.

| Value | String |
|---|---|
| `QueueEvents.Added` | `"added"` |
| `QueueEvents.Cancelled` | `"cancelled"` |
| `QueueEvents.Failed` | `"failed"` |
| `QueueEvents.Succeeded` | `"succeeded"` |
| `QueueEvents.Progress` | `"progress"` |
| `QueueEvents.Start` | `"start"` |
| `QueueEvents.Stop` | `"stop"` |

---

## Retry behaviour

When a job fails, the queue automatically creates a new `Waiting` run sharing the same `jobId`, up to a maximum of **3 retries**. Between attempts, the `jobId` is placed into backoff using the configured [`DelayCalculator`](#delaycalculator) (exponential by default: 1 s → 2 s → 4 s, capped at 60 s).

After 3 failed attempts the `Failed` event is emitted with no rescheduled run. Retry counts are **not persisted** — restarting the process resets them.

---

## See Also

- [How the Daemon works](/guides/how-the-daemon-works) — The daemon uses the queue to coordinate mod download and extraction jobs.
- [Errors as Values](/guides/errors-as-values) — The Go-style tuple pattern used by `Processor.process()`.

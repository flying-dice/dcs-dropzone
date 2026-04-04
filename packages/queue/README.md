# @packages/queue

A lightweight job queue library for single-instance applications using the Ports & Adapters pattern.

## Overview

This package provides a simple job queue with automatic retries, scheduled execution, and pluggable persistence. It is designed for single-instance applications and does not support distributed locking.

## Usage

```typescript

import {
  Queue,
  InMemoryJobRepo,
  InMemoryRunRepo,
  ExponentialBackoff,
  type Processor,
} from "@packages/queue";

// Create adapters
const runRepo = new InMemoryRunRepo();
const jobRepo = new InMemoryJobRepo(runRepo);
const exponentCalculator = new ExponentialBackoff();

// Define a processor
const myProcessor: Processor<{ foo: string }, string> = {
  name: "my-job",
  process: async (data, ctx) => {
    try {
      // Your job logic here
      const result = await doWork(data);
      return [result, null];
    } catch (error) {
      return [undefined, error.message];
    }
  },
};

// Create and start the queue
const queue = new Queue(
  { jobRepo, runRepo, exponentCalculator },
  { processors: [myProcessor] }
);

queue.start();

// Add jobs
await queue.add("my-job", { foo: "bar" });

// Schedule for later
await queue.add("my-job", { foo: "baz" }, new Date(Date.now() + 60000));
```

## Architecture

The library uses the **Ports & Adapters** pattern to separate business logic from infrastructure concerns.

### Ports (Interfaces)

Implement these interfaces to bring your own persistence:

- `JobRepo` - Job persistence
- `RunRepo` - Run history persistence  
- `ExponentCalculator` - Retry delay calculation

### Provided Adapters

- `InMemoryJobRepo` - In-memory job storage
- `InMemoryRunRepo` - In-memory run storage
- `ExponentialBackoff` - Exponential backoff retry strategy

## API

See the TypeScript types for detailed API documentation. Key exports:

- `Queue` - Main queue class
- `JobRun` - Job execution wrapper
- `Job`, `Run`, `Processor`, `ProcessorContext` - Core types
- `RunState`, `RunErrorCode` - Enums
- `JobRepo`, `RunRepo`, `ExponentCalculator` - Port interfaces
- `InMemoryJobRepo`, `InMemoryRunRepo`, `ExponentialBackoff` - Adapter implementations

## Important Notes

- **Single-instance only**: This queue does not support distributed locking or multi-instance coordination
- **Jobs are retried on failure**: Use `ExponentialBackoff` to configure retry delays
- **Processors must return a `[TResult, null] | [undefined, string]` tuple**: Return `[result, null]` for success and `[undefined, reason]` for failure

// Core Queue implementation

export type { ExponentialBackoffOptions } from "./adapters/ExponentialBackoff.ts";
// Adapters (provided implementations)
export { ExponentialBackoff, InMemoryJobRepo, InMemoryRunRepo } from "./adapters/index.ts";
export { JobRun } from "./JobRun.ts";
export type { ExponentCalculator } from "./ports/ExponentCalculator.ts";

// Ports (interfaces for dependency injection)
export type { JobRepo } from "./ports/JobRepo.ts";
export type { RunRepo } from "./ports/RunRepo.ts";
export { Queue } from "./Queue.ts";
export type { Job, Processor, ProcessorContext, Run } from "./types.ts";
// Types
export { RunErrorCode, RunState } from "./types.ts";

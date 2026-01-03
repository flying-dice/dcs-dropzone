import * as assert from "node:assert";
import { type Job, type Processor, type ProcessorContext, type Run, RunErrorCode, RunState } from "./types.ts";

export class JobRun<TData = any, TResult = any> {
	private readonly processor: Processor<TData, TResult>;
	private readonly initialJob: Job<TData>;
	public readonly run: Run<TResult>;
	private readonly abortController: AbortController = new AbortController();

	constructor(job: Job<TData>, processor: Processor<TData, TResult>) {
		this.initialJob = job;

		this.run = {
			id: crypto.randomUUID(),
			jobId: job.id,
			jobName: job.name,
			attempt: job.attempts + 1,
			state: RunState.Running,
			startedAt: new Date(),
		};

		this.processor = processor;
	}

	async process(props: {
		onProgress: (progress: number) => Promise<void>;
		onSuccess: () => void;
		onFailed: () => void;
	}): Promise<void> {
		try {
			const ctx: ProcessorContext = {
				updateProgress: props.onProgress,
				abortSignal: this.abortController.signal,
			};

			const res = await this.processor.process(this.initialJob.data, ctx);

			assert.ok(
				typeof res === "object" && ["isOk", "isErr", "match"].every((it) => it in res),
				`Processor returned an invalid value, expected type 'Result' but received type '${typeof res}'`,
			);

			res.match(
				(result) => {
					this.run.state = RunState.Success;
					this.run.endedAt = new Date();
					this.run.result = result;

					props.onSuccess();
				},
				(message) => {
					this.run.state = RunState.Failed;
					this.run.endedAt = new Date();
					this.run.error = {
						code: RunErrorCode.ProcessorError,
						message,
					};

					props.onFailed();
				},
			);
		} catch (error) {
			this.run.state = RunState.Failed;
			this.run.endedAt = new Date();
			this.run.error = {
				code: RunErrorCode.ProcessorException,
				message: error instanceof Error ? error.message : String(error),
			};
		}
	}
}

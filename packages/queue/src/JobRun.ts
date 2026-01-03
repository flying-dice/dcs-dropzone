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
		const ctx: ProcessorContext = {
			updateProgress: props.onProgress,
			abortSignal: this.abortController.signal,
		};

		const res = await this.processor.process(this.initialJob.data, ctx);

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
	}
}

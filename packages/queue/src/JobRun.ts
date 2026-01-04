import * as assert from "node:assert";
import { JobErrorCode, type JobRecord } from "./JobRecordRepository.ts";
import type { Processor, ProcessorContext } from "./Processor.ts";

export class JobRun<TData = any, TResult = any> {
	private readonly abortController: AbortController = new AbortController();

	constructor(
		private readonly jobRecord: JobRecord<TData, TResult>,
		private readonly processor: Processor<TData, TResult>,
	) {}

	async process(props: {
		onProgress: (progress: number) => void;
		onSuccess: (res: TResult) => void;
		onFailed: (code: JobErrorCode, message: string) => void;
	}): Promise<void> {
		try {
			const ctx: ProcessorContext = {
				updateProgress: props.onProgress,
				abortSignal: this.abortController.signal,
			};

			const res = await this.processor.process(this.jobRecord.jobData, ctx);

			assert.ok(
				typeof res === "object" && ["isOk", "isErr", "match"].every((it) => it in res),
				`Processor returned an invalid value, expected type 'Result' but received type '${typeof res}'`,
			);

			res.match(
				(result) => props.onSuccess(result),
				(message) => props.onFailed(JobErrorCode.ProcessorError, message),
			);
		} catch (error) {
			props.onFailed(JobErrorCode.ProcessorException, String(error));
		}
	}
}

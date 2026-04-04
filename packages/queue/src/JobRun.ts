import * as assert from "node:assert";
import { JobErrorCode, type JobRecord } from "./JobRecordRepository.ts";
import type { Processor, ProcessorContext } from "./Processor.ts";

export class JobRun<TData = any, TResult = any> {
	private readonly abortController: AbortController = new AbortController();

	constructor(
		private readonly jobRecord: JobRecord<TData, TResult>,
		private readonly processor: Processor<TData, TResult>,
	) {}

	abort(): void {
		this.abortController.abort();
	}

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
				Array.isArray(res) && res.length === 2,
				`Processor returned an invalid value, expected a [result, null] | [undefined, error] tuple but received type '${typeof res}'`,
			);

			const [result, error] = res;
			if (error !== null && error !== undefined) {
				props.onFailed(JobErrorCode.ProcessorError, error);
			} else {
				props.onSuccess(result as TResult);
			}
		} catch (error) {
			props.onFailed(JobErrorCode.ProcessorException, String(error));
		}
	}
}

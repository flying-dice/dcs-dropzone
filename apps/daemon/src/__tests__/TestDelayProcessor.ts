import type { Processor, ProcessorContext } from "@packages/queue";
import { getLogger } from "log4js";
import { ok, type Result } from "neverthrow";
import { delay } from "./utils.ts";

const logger = getLogger("TestDownloadProcessor");

export class TestDelayProcessor<NAME extends string, TData, TResult> implements Processor<TData, TResult> {
	public readonly name: NAME;

	constructor(name: NAME) {
		this.name = name;
	}

	async process(data: TData, ctx: ProcessorContext): Promise<Result<TResult, string>> {
		logger.debug(`Processing download job: ${JSON.stringify(data)}`);

		await delay(50, ctx.abortSignal);
		ctx.updateProgress(25);

		await delay(50, ctx.abortSignal);
		ctx.updateProgress(50);

		await delay(50, ctx.abortSignal);
		ctx.updateProgress(75);

		await delay(50, ctx.abortSignal);
		ctx.updateProgress(100);

		return ok({} as TResult);
	}
}

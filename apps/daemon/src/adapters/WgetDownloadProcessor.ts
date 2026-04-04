import type { ProcessorContext } from "@packages/queue";
import { getLogger } from "log4js";
import type { DownloadJobData, DownloadJobResult, DownloadProcessor } from "../application/ports/DownloadProcessor.ts";
import { spawnWget } from "../child_process/wget.ts";

const logger = getLogger("WgetDownloadProcessor");

type Deps = {
	wgetExecutablePath: string;
};

export class WgetDownloadProcessor implements DownloadProcessor {
	public readonly name: "download" = "download";

	constructor(protected readonly deps: Deps) {}

	async process(
		jobData: DownloadJobData,
		ctx: ProcessorContext,
	): Promise<[DownloadJobResult, null] | [undefined, string]> {
		logger.debug(`Processing download job: ${JSON.stringify(jobData)}`);
		const [filePath, wgetErr] = await spawnWget({
			url: jobData.url,
			exePath: this.deps.wgetExecutablePath,
			target: jobData.destinationFolder,
			onProgress: (progress) => {
				ctx.updateProgress(progress.progress);
			},
		});

		if (wgetErr) {
			logger.error("Wget download failed with error: ", wgetErr);
			return [undefined, wgetErr];
		}

		logger.debug("Wget download successful, file path: ", filePath);
		return [{ filePath }, null];
	}
}

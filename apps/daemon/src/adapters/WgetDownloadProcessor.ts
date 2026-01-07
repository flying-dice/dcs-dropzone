import { Log } from "@packages/decorators";
import type { ProcessorContext } from "@packages/queue";
import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import type { DownloadJobData, DownloadJobResult, DownloadProcessor } from "../application/ports/DownloadProcessor.ts";
import { spawnWget } from "../child_process/wget.ts";

const logger = getLogger("WgetDownloadProcessor");

type Deps = {
	wgetExecutablePath: string;
};

export class WgetDownloadProcessor implements DownloadProcessor {
	public readonly name: "download" = "download";

	constructor(protected readonly deps: Deps) {}

	@Log(logger)
	async process(jobData: DownloadJobData, ctx: ProcessorContext): Promise<Result<DownloadJobResult, string>> {
		logger.debug(`Processing download job: ${JSON.stringify(jobData)}`);
		const res = await spawnWget({
			url: jobData.url,
			exePath: this.deps.wgetExecutablePath,
			target: jobData.destinationFolder,
			onProgress: (progress) => {
				ctx.updateProgress(progress.progress);
			},
		});

		logger.debug("Wget download completed with result: ", res);
		return res.match(
			(result) => {
				logger.debug("Wget download successful, file path: ", result);

				return ok({
					filePath: result,
				});
			},
			(error) => {
				logger.error("Wget download failed with error: ", error);
				return err(error);
			},
		);
	}
}

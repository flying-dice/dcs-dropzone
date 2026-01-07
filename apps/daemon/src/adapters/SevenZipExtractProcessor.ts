import { Log } from "@packages/decorators";
import type { ProcessorContext } from "@packages/queue";
import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import type { ExtractJobData, ExtractJobResult, ExtractProcessor } from "../application/ports/ExtractProcessor.ts";
import { spawnSevenzip } from "../child_process/sevenzip.ts";

const logger = getLogger("SevenZipExtractProcessor");

type Deps = {
	sevenZipExecutablePath: string;
};

export class SevenZipExtractProcessor implements ExtractProcessor {
	public readonly name: "extract" = "extract";

	constructor(protected readonly deps: Deps) {}

	@Log(logger)
	async process(jobData: ExtractJobData, ctx: ProcessorContext): Promise<Result<ExtractJobResult, string>> {
		logger.debug(`Processing extract job: ${JSON.stringify(jobData)}`);
		const res = await spawnSevenzip({
			archivePath: jobData.archivePath,
			exePath: this.deps.sevenZipExecutablePath,
			targetDir: jobData.destinationFolder,
			onProgress: (progress) => {
				ctx.updateProgress(progress.progress);
			},
		});

		logger.debug("SevenZip extraction completed with result: ", res);
		return res.match(
			(_result) => {
				logger.debug("SevenZip extraction successful, destination folder: ", jobData.destinationFolder);
				return ok({
					destinationFolder: jobData.destinationFolder,
				});
			},
			(error) => {
				logger.error("SevenZip extraction failed with error: ", error);
				return err(error);
			},
		);
	}
}

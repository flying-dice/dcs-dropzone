import type { ProcessorContext } from "@packages/queue";
import { getLogger } from "log4js";
import type { ExtractJobData, ExtractJobResult, ExtractProcessor } from "../application/ports/ExtractProcessor.ts";
import { spawnSevenzip } from "../child_process/sevenzip.ts";

const logger = getLogger("SevenZipExtractProcessor");

type Deps = {
	sevenZipExecutablePath: string;
};

export class SevenZipExtractProcessor implements ExtractProcessor {
	public readonly name: "extract" = "extract";

	constructor(protected readonly deps: Deps) {}

	async process(
		jobData: ExtractJobData,
		ctx: ProcessorContext,
	): Promise<[ExtractJobResult, null] | [undefined, string]> {
		logger.debug(`Processing extract job: ${JSON.stringify(jobData)}`);
		const [, sevenzipErr] = await spawnSevenzip({
			archivePath: jobData.archivePath,
			exePath: this.deps.sevenZipExecutablePath,
			targetDir: jobData.destinationFolder,
			onProgress: (progress) => {
				ctx.updateProgress(progress.progress);
			},
		});

		if (sevenzipErr) {
			logger.error("SevenZip extraction failed with error: ", sevenzipErr);
			return [undefined, sevenzipErr];
		}

		logger.debug("SevenZip extraction successful, destination folder: ", jobData.destinationFolder);
		return [{ destinationFolder: jobData.destinationFolder }, null];
	}
}

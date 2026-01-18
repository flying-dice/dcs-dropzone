import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import type { DownloadsRepository } from "../ports/DownloadsRepository.ts";

const logger = getLogger("Downloads");

type Deps = {
	downloadsRepository: DownloadsRepository;
};

export class Downloads {
	constructor(private readonly deps: Deps) {}

	@Log(logger)
	async registerModReleaseDownload(modId: string, releaseId: string, daemonInstanceId: string): Promise<void> {
		logger.info("Registering download", { modId, releaseId, daemonInstanceId });
		try {
			await this.deps.downloadsRepository.addModReleaseDownload(modId, releaseId, daemonInstanceId);
			logger.debug("Download registered successfully", { modId, releaseId });
		} catch (error) {
			logger.error("Failed to register download", { modId, releaseId, error });
			throw error;
		}
	}

	@Log(logger)
	async getModReleaseDownloadCount(modId: string, releaseId: string): Promise<number> {
		logger.debug("Fetching release download count", { modId, releaseId });
		return this.deps.downloadsRepository.getModReleaseDownloadCount(modId, releaseId);
	}

	@Log(logger)
	async getModDownloadCount(modId: string): Promise<number> {
		logger.debug("Fetching mod download count", { modId });
		return this.deps.downloadsRepository.getModDownloadCount(modId);
	}
}

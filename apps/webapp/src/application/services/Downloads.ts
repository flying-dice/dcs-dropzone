import { getLogger } from "log4js";
import type { DownloadsRepository } from "../ports/DownloadsRepository.ts";

const logger = getLogger("Downloads");

type Deps = {
	downloadsRepository: DownloadsRepository;
};

export class Downloads {
	constructor(private readonly deps: Deps) {}

	async registerModReleaseDownload(modId: string, releaseId: string, daemonInstanceId: string): Promise<void> {
		logger.debug({ modId, releaseId, daemonInstanceId }, "registerModReleaseDownload start");
		await this.deps.downloadsRepository.addModReleaseDownload(modId, releaseId, daemonInstanceId);
		logger.debug({ modId, releaseId, daemonInstanceId }, "registerModReleaseDownload complete");
	}

	async getModReleaseDownloadCount(modId: string, releaseId: string): Promise<number> {
		return this.deps.downloadsRepository.getModReleaseDownloadCount(modId, releaseId);
	}

	async getModDownloadCount(modId: string): Promise<number> {
		return this.deps.downloadsRepository.getModDownloadCount(modId);
	}
}

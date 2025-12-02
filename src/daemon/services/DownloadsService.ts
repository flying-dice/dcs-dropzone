import { getLogger } from "log4js";
import type { DownloadsRepository } from "../repositories/DownloadsRepository.ts";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import type { ReleaseAssetService } from "./ReleaseAssetService.ts";
import type { ToggleService } from "./ToggleService.ts";

const logger = getLogger("SubscriptionService");

/**
 * Factory function type for creating ReleaseAssetService instances
 */
export type ReleaseAssetServiceFactory = (
	releaseId: string,
) => ReleaseAssetService;

export class DownloadsService {
	constructor(
		private readonly repo: DownloadsRepository,
		private readonly toggleService: ToggleService,
		private readonly releaseAssetServiceFactory: ReleaseAssetServiceFactory,
	) {}

	getAll() {
		return this.repo.getAll();
	}

	async remove(releaseId: string) {
		logger.info(`Removing releaseId: ${releaseId}`);

		this.toggleService.disableRelease(releaseId);

		await this.releaseAssetServiceFactory(
			releaseId,
		).removeReleaseAssetsAndFolder();

		this.repo.deleteByReleaseId(releaseId);

		logger.info(`Successfully removed releaseId: ${releaseId}`);
	}

	async add(data: ModAndReleaseData) {
		logger.info(`Adding mod: ${data.modName} (release: ${data.version})`);

		this.repo.saveRelease(data);

		logger.info(
			`Successfully added mod: ${data.modName} (release: ${data.version})`,
		);

		await this.releaseAssetServiceFactory(
			data.releaseId,
		).downloadAndExtractReleaseAssets();
	}
}

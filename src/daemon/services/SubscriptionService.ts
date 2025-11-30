import { getLogger } from "log4js";
import type { SubscriptionRepository } from "../repositories/SubscriptionRepository.ts";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import type { ReleaseAssetService } from "./ReleaseAssetService.ts";

const logger = getLogger("SubscriptionService");

/**
 * Factory function type for creating ReleaseAssetService instances
 */
export type ReleaseAssetServiceFactory = (
	releaseId: string,
) => ReleaseAssetService;

export class SubscriptionService {
	constructor(
		private readonly repo: SubscriptionRepository,
		private readonly releaseAssetServiceFactory: ReleaseAssetServiceFactory,
	) {}

	getAllSubscriptions(): ModAndReleaseData[] {
		return this.repo.getAll();
	}

	async removeSubscription(releaseId: string) {
		logger.info(`Removing subscription for releaseId: ${releaseId}`);

		await this.releaseAssetServiceFactory(
			releaseId,
		).removeReleaseAssetsAndFolder();

		this.repo.deleteByReleaseId(releaseId);

		logger.info(
			`Successfully removed subscription for releaseId: ${releaseId}`,
		);
	}

	async subscribeToRelease(data: ModAndReleaseData) {
		logger.info(
			`Subscribing to mod: ${data.modName} (release: ${data.version})`,
		);

		this.repo.saveRelease(data);

		logger.info(
			`Successfully subscribed to mod: ${data.modName} (release: ${data.version})`,
		);

		await this.releaseAssetServiceFactory(
			data.releaseId,
		).downloadAndExtractReleaseAssets();
	}
}

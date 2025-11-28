import { getLogger } from "log4js";
import Application from "../Application.ts";
import type { DownloadQueue } from "../queues/DownloadQueue.ts";
import type { SubscriptionRepository } from "../repositories/SubscriptionRepository.ts";
import type { ModReleaseData } from "../schemas/ModAndReleaseData.ts";

const logger = getLogger("SubscriptionService");

export class SubscriptionService {
	constructor(
		private readonly repo: SubscriptionRepository,
		private readonly downloadQueue: DownloadQueue,
	) {}

	getAllSubscriptions(): { modId: string; releaseId: string }[] {
		return this.repo.getAll();
	}

	async removeSubscription(releaseId: string) {
		logger.info(`Removing subscription for releaseId: ${releaseId}`);

		this.downloadQueue.cancelJobsForRelease(releaseId);

		await Application.getReleaseAssetService(
			releaseId,
		).removeReleaseAssetsAndFolder();

		this.repo.deleteByReleaseId(releaseId);

		logger.info(
			`Successfully removed subscription for releaseId: ${releaseId}`,
		);
	}

	subscribeToRelease(data: ModReleaseData) {
		logger.info(
			`Subscribing to mod: ${data.modName} (release: ${data.version})`,
		);

		this.repo.saveRelease(data);

		logger.info(
			`Successfully subscribed to mod: ${data.modName} (release: ${data.version})`,
		);

		Application.getReleaseAssetService(
			data.releaseId,
		).downloadAndExtractReleaseAssets();
	}
}

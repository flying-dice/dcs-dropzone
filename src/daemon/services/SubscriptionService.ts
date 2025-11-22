import Application from "../Application.ts";
import Logger from "../Logger.ts";
import type { SubscriptionRepository } from "../repositories/SubscriptionRepository.ts";
import type { ModReleaseData } from "../schemas/ModAndReleaseData.ts";

const logger = Logger.getLogger("SubscriptionService");

export class SubscriptionService {
  constructor(private readonly repo: SubscriptionRepository) {}

	getAllSubscriptions(): { modId: string; releaseId: string }[] {
		return this.repo.getAll();
	}

	async removeSubscription(releaseId: string) {
		logger.info(`Removing subscription for releaseId: ${releaseId}`);

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

		setTimeout(() => {
			Application.getReleaseAssetService(
				data.releaseId,
			).downloadAndExtractReleaseAssets();
		});
	}
}

import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import type { DownloadsRepository } from "../application/ports/DownloadsRepository.ts";
import { Mod } from "../database/entities/Mod.ts";
import { ModRelease } from "../database/entities/ModRelease.ts";
import { ModReleaseDownload } from "../database/entities/ModReleaseDownload.ts";

const logger = getLogger("MongoDownloadsRepository");

/**
 * MongoDB implementation of the DownloadsRepository port using Mongoose.
 */
export class MongoDownloadsRepository implements DownloadsRepository {
	@Log(logger)
	async addModReleaseDownload(modId: string, releaseId: string, daemonInstanceId: string): Promise<void> {
		await ModReleaseDownload.updateOne(
			{ releaseId, daemonInstanceId },
			{
				modId,
				releaseId,
				daemonInstanceId,
			},
			{
				upsert: true,
			},
		).exec();

		// Update the downloads count on the release
		const releaseDownloadCount = await this.getModReleaseDownloadCount(modId, releaseId);
		await ModRelease.updateOne({ id: releaseId, modId }, { $set: { downloadsCount: releaseDownloadCount } }).exec();

		// Update the downloads count on the mod
		const modDownloadCount = await this.getModDownloadCount(modId);
		await Mod.updateOne({ id: modId }, { $set: { downloadsCount: modDownloadCount } }).exec();
	}

	@Log(logger)
	async getModReleaseDownloadCount(modId: string, releaseId: string): Promise<number> {
		return ModReleaseDownload.countDocuments({ modId, releaseId }).exec();
	}

	@Log(logger)
	async getModDownloadCount(modId: string): Promise<number> {
		return ModReleaseDownload.countDocuments({ modId }).exec();
	}
}

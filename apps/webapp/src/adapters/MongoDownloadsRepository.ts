import type { DownloadsRepository } from "../application/ports/DownloadsRepository.ts";
import { Mod } from "../database/entities/Mod.ts";
import { ModRelease } from "../database/entities/ModRelease.ts";
import { ModReleaseDownload } from "../database/entities/ModReleaseDownload.ts";

/**
 * MongoDB implementation of the DownloadsRepository port using Mongoose.
 */
export class MongoDownloadsRepository implements DownloadsRepository {
	async addModReleaseDownload(modId: string, releaseId: string, daemonInstanceId: string): Promise<void> {
		// Try to add a download record (unique constraint will prevent duplicates)
		try {
			await ModReleaseDownload.create({
				modId,
				releaseId,
				daemonInstanceId,
			});
		} catch (error: unknown) {
			// If duplicate key error, the download was already registered - that's fine
			if (error && typeof error === "object" && "code" in error && error.code === 11000) {
				return;
			}
			throw error;
		}

		// Update the downloads count on the release
		const releaseDownloadCount = await this.getModReleaseDownloadCount(modId, releaseId);
		await ModRelease.updateOne({ id: releaseId, modId }, { downloadsCount: releaseDownloadCount }).exec();

		// Update the downloads count on the mod
		const modDownloadCount = await this.getModDownloadCount(modId);
		await Mod.updateOne({ id: modId }, { downloadsCount: modDownloadCount }).exec();
	}

	async getModReleaseDownloadCount(modId: string, releaseId: string): Promise<number> {
		return ModReleaseDownload.countDocuments({ modId, releaseId }).exec();
	}

	async getModDownloadCount(modId: string): Promise<number> {
		return ModReleaseDownload.countDocuments({ modId }).exec();
	}
}

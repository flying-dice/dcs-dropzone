import { exists, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { getLogger, type Logger } from "log4js";
import { T_MOD_RELEASE_ASSETS, T_MOD_RELEASES } from "../database/schema.ts";
import type { DownloadQueue } from "../queues/DownloadQueue.ts";

const logger = getLogger("ReleaseDownloadService");

type ReleaseData = {
	releaseId: string;
	modId: string;
	modName: string;
	version: string;
};

export class ReleaseAssetService {
	private readonly logger: Logger;
	private readonly release: ReleaseData;

	constructor(
		private readonly releaseId: string,
		private readonly db: BunSQLiteDatabase,
		private readonly downloadQueue: DownloadQueue,
	) {
		logger.debug(
			`ReleaseAssetService initialized for releaseId: ${this.releaseId}`,
		);

		const release = this.db
			.select({
				releaseId: T_MOD_RELEASES.releaseId,
				modId: T_MOD_RELEASES.modId,
				modName: T_MOD_RELEASES.modName,
				version: T_MOD_RELEASES.version,
			})
			.from(T_MOD_RELEASES)
			.where(eq(T_MOD_RELEASES.releaseId, this.releaseId))
			.get();

		if (!release) {
			throw new Error(`Release with ID ${releaseId} not found in database.`);
		}

		this.release = release;
		this.logger = getLogger(`${logger.category}:${this.release.releaseId}`);
	}

	async removeReleaseAssetsAndFolder(): Promise<void> {
		this.logger.info(`Removing release assets and folder`);

		await this.removeReleaseFolder();

		this.logger.info(`Successfully removed release assets from database`);
	}

	async downloadAndExtractReleaseAssets(): Promise<void> {
		this.logger.info(`Starting download and extraction for release`);

		this.logger.debug(`Ensuring release folder exists`);
		const releaseFolder = await this.ensureReleaseFolder();

		this.logger.debug(`Fetching release assets`);
		const assets = this.getAssetsForRelease();

		this.logger.info(`Downloading ${assets.length} assets for release`);

		for (const asset of assets) {
			this.logger.debug(`Downloading asset: ${asset.name}`);

			for (const [idx, url] of asset.urls.entries()) {
				this.logger.debug(`Pushing download job for URL: ${url}`);
				this.downloadQueue.pushJob(
					this.releaseId,
					asset.id,
					`${asset.id}:${idx}`,
					url,
					releaseFolder,
				);
			}
		}

		this.logger.info(
			`All download jobs pushed to queue, waiting for completion`,
		);
	}

	private async ensureReleaseFolder(): Promise<string> {
		const releaseFolder = resolve(process.cwd(), this.releaseId);
		await mkdir(releaseFolder, { recursive: true });
		return releaseFolder;
	}

	private async removeReleaseFolder(): Promise<void> {
		const releaseFolder = resolve(process.cwd(), this.releaseId);
		if (await exists(releaseFolder)) {
			await rm(releaseFolder, { recursive: true, force: true });
			this.logger.info(`Removed release folder: ${releaseFolder}`);
		} else {
			this.logger.info(`Release folder does not exist: ${releaseFolder}`);
		}
	}

	private getAssetsForRelease() {
		return this.db
			.select()
			.from(T_MOD_RELEASE_ASSETS)
			.where(eq(T_MOD_RELEASE_ASSETS.releaseId, this.releaseId))
			.all();
	}
}

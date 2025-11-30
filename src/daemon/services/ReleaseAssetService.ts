import { exists, mkdir, rm } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { getLogger, type Logger } from "log4js";
import type { DownloadQueue } from "../queues/DownloadQueue.ts";
import type { ExtractQueue } from "../queues/ExtractQueue.ts";
import type {
	ReleaseAssetRepository,
	ReleaseData,
} from "../repositories/ReleaseAssetRepository.ts";

const logger = getLogger("ReleaseDownloadService");

export class ReleaseAssetService {
	private readonly logger: Logger;
	private readonly release: ReleaseData;

	constructor(
		private readonly releaseId: string,
		private readonly repository: ReleaseAssetRepository,
		private readonly downloadQueue: DownloadQueue,
		private readonly extractQueue: ExtractQueue,
	) {
		logger.debug(
			`ReleaseAssetService initialized for releaseId: ${this.releaseId}`,
		);

		const release = this.repository.getReleaseById(this.releaseId);

		if (!release) {
			throw new Error(`Release with ID ${releaseId} not found in database.`);
		}

		this.release = release;
		this.logger = getLogger(`${logger.category}:${this.release.releaseId}`);
	}

	async removeReleaseAssetsAndFolder(): Promise<void> {
		this.logger.info(`Removing release assets and folder`);

		// Cancel any pending download and extract jobs for this release
		this.downloadQueue.cancelJobsForRelease(this.releaseId);
		this.extractQueue.cancelJobsForRelease(this.releaseId);

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

			const downloadJobIds: string[] = [];

			for (const [idx, url] of asset.urls.entries()) {
				const downloadJobId = `${asset.id}:${idx}`;
				this.logger.debug(`Pushing download job for URL: ${url}`);
				this.downloadQueue.pushJob(
					this.releaseId,
					asset.id,
					downloadJobId,
					url,
					releaseFolder,
				);
				downloadJobIds.push(downloadJobId);
			}

			// If the asset is an archive, create an extract job that depends on all download jobs
			if (asset.isArchive && asset.urls.length > 0) {
				// For multipart archives, the first file is typically the main archive
				const firstUrl = asset.urls[0] as string;
				const archivePath = join(
					releaseFolder,
					decodeURIComponent(basename(firstUrl)),
				);

				this.logger.debug(
					`Pushing extract job for archive: ${archivePath} with ${downloadJobIds.length} download dependencies`,
				);
				this.extractQueue.pushJob(
					this.releaseId,
					asset.id,
					`extract:${asset.id}`,
					archivePath,
					releaseFolder,
					downloadJobIds,
				);
			}

			// Log warning if asset is marked as archive but has no URLs
			if (asset.isArchive && asset.urls.length === 0) {
				this.logger.warn(
					`Asset "${asset.name}" (id: ${asset.id}) is marked as archive but has no URLs. No extract job will be created.`,
				);
			}
		}

		this.logger.info(
			`All download and extract jobs pushed to queues, waiting for completion`,
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
		return this.repository.getAssetsForRelease(this.releaseId);
	}
}

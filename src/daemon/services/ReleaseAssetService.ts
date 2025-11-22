import { exists, mkdir, rm } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { and, eq } from "drizzle-orm";
import type { Logger as PLogger } from "pino";
import { AssetStatus } from "../../common/data.ts";
import { err, match, ok, type Result } from "../../common/Result.ts";
import { db } from "../database";
import { T_MOD_RELEASE_ASSETS, T_MOD_RELEASES } from "../database/schema.ts";
import Logger from "../Logger.ts";
import type { SevenzipService } from "./SevenzipService.ts";
import type { WgetService } from "./WgetService.ts";

const logger = Logger.getLogger("ReleaseDownloadService");

type ReleaseData = {
	releaseId: string;
	modId: string;
	modName: string;
	version: string;
};

export class ReleaseAssetService {
	private readonly logger: PLogger;
	private readonly release: ReleaseData;

	constructor(
		private readonly releaseId: string,
		private readonly wgetService: WgetService,
		private readonly sevenzipService: SevenzipService,
	) {
		logger.debug(
			`ReleaseAssetService initialized for releaseId: ${this.releaseId}`,
		);

		const release = db
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
		this.logger = logger.child(this.release);
	}

	async removeReleaseAssetsAndFolder(): Promise<void> {
		this.logger.info(`Removing release assets and folder`);
		const releaseFolder = resolve(process.cwd(), this.releaseId);

		this.removeReleaseFolder();

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
			this.updateAssetStatus(asset.id, AssetStatus.DOWNLOADING);

			this.logger.debug(`Downloading asset: ${asset.name}`);

			for (const url of asset.urls) {
				const downloadedPath = await this.downloadFile(url, releaseFolder);
				match(downloadedPath, {
					ok: (path) => {
						this.updateAssetStatus(asset.id, AssetStatus.DOWNLOADED);
						this.logger.debug(
							`Asset downloaded successfully: ${asset.name} to ${path}`,
						);
					},
					err: (error) => {
						this.updateAssetStatus(asset.id, AssetStatus.DOWNLOAD_FAILED);
						this.logger.debug(
							`Failed to download asset: ${asset.name}, error: ${error}`,
						);
					},
				});
			}
		}

		this.logger.info(this.release, `All assets downloaded`);

		const archiveAssetsSuccessfullyDownloaded =
			this.getArchiveAssetsSuccessfullyDownloaded();

		this.logger.info(
			this.release,
			`Extracting ${archiveAssetsSuccessfullyDownloaded.length} archives`,
		);

		for (const asset of archiveAssetsSuccessfullyDownloaded) {
			this.logger.debug(`Extracting asset: ${asset.name}`);

			this.updateAssetStatus(asset.id, AssetStatus.EXTRACTING);
			const [primaryUrl] = asset.urls;

			if (!primaryUrl) {
				this.logger.debug(`No URLs found for asset: ${asset.name}`);
				this.updateAssetStatus(asset.id, AssetStatus.EXTRACTION_FAILED);
				continue;
			}

			const archivePath = join(releaseFolder, basename(primaryUrl));

			const extractResult = await this.extractArchive(
				archivePath,
				releaseFolder,
			);

			match(extractResult, {
				ok: () => {
					this.logger.debug(`Asset extracted: ${asset.name}`);
					this.updateAssetStatus(asset.id, AssetStatus.EXTRACTED);
				},
				err: (error) => {
					this.logger.debug(
						`Failed to extract asset: ${asset.name}, error: ${error}`,
					);
					this.updateAssetStatus(asset.id, AssetStatus.EXTRACTION_FAILED);
				},
			});

			this.logger.debug(`Asset extracted successfully: ${asset.name}`);
		}

		this.logger.info(`All archives extracted successfully`);
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
		return db
			.select()
			.from(T_MOD_RELEASE_ASSETS)
			.where(eq(T_MOD_RELEASE_ASSETS.releaseId, this.releaseId))
			.all();
	}

	private getArchiveAssetsSuccessfullyDownloaded() {
		return db
			.select()
			.from(T_MOD_RELEASE_ASSETS)
			.where(
				and(
					eq(T_MOD_RELEASE_ASSETS.releaseId, this.releaseId),
					eq(T_MOD_RELEASE_ASSETS.isArchive, true),
					eq(T_MOD_RELEASE_ASSETS.status, AssetStatus.DOWNLOADED),
				),
			)
			.all();
	}

	private async downloadFile(
		url: string,
		targetPath: string,
	): Promise<Result<string, string>> {
		try {
			const path = await this.wgetService.download({
				url,
				target: targetPath,
				onProgress: (progress) => {
					this.logger.debug(
						`Download progress for ${url}: ${progress.progress}%`,
					);
				},
			});

			this.logger.info(`Successfully Downloaded: ${targetPath}`);
			return ok(path);
		} catch (e) {
			this.logger.error(`Failed to download file: ${e}`);
			return err(e.toString());
		}
	}

	private async extractArchive(
		archivePath: string,
		targetDir: string,
	): Promise<Result<void, string>> {
		try {
			await this.sevenzipService.extract({
				archivePath,
				targetDir,
				onProgress: (progress) => {
					this.logger.debug(
						`Extraction progress for ${archivePath}: ${progress.progress}%`,
					);
				},
			});
			this.logger.info(`Successfully extracted: ${archivePath}`);
		} catch (e) {
			this.logger.error(`Failed to extract archive: ${e}`);
			return err(e.toString());
		}

		return ok(undefined);
	}

	private updateAssetStatus(assetId: string, status: AssetStatus): void {
		db.update(T_MOD_RELEASE_ASSETS)
			.set({ status })
			.where(eq(T_MOD_RELEASE_ASSETS.id, assetId))
			.run();
	}
}

import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { eq } from "drizzle-orm";
import { AssetStatus } from "../../common/data.ts";
import { db } from "../database";
import { T_MOD_RELEASE_ASSETS } from "../database/schema.ts";
import { getLogger } from "../Logger.ts";
import type { SevenzipService } from "./SevenzipService.ts";
import type { WgetService } from "./WgetService.ts";

export type ReleaseDownloadServiceProps = {
	wgetService: WgetService;
	sevenzipService: SevenzipService;
};

export class ReleaseDownloadService {
	private readonly logger = getLogger(ReleaseDownloadService.name);
	private readonly wgetService: WgetService;
	private readonly sevenzipService: SevenzipService;

	constructor({ wgetService, sevenzipService }: ReleaseDownloadServiceProps) {
		this.wgetService = wgetService;
		this.sevenzipService = sevenzipService;
	}

	async downloadAndExtractRelease(releaseId: string): Promise<void> {
		this.logger.info(
			`Starting download and extraction for release: ${releaseId}`,
		);

		// Create release folder in CWD
		const releaseFolder = resolve(process.cwd(), releaseId);
		await mkdir(releaseFolder, { recursive: true });

		// Get all assets for this release
		const assets = db
			.select()
			.from(T_MOD_RELEASE_ASSETS)
			.where(eq(T_MOD_RELEASE_ASSETS.releaseId, releaseId))
			.all();

		if (assets.length === 0) {
			this.logger.warn(`No assets found for release: ${releaseId}`);
			return;
		}

		// Phase 1: Download all assets
		this.logger.info(
			`Downloading ${assets.length} assets for release: ${releaseId}`,
		);
		const downloadedFiles: string[] = [];

		for (const asset of assets) {
			try {
				// Update status to DOWNLOADING
				db.update(T_MOD_RELEASE_ASSETS)
					.set({ status: AssetStatus.DOWNLOADING })
					.where(eq(T_MOD_RELEASE_ASSETS.id, asset.id))
					.run();

				this.logger.debug(`Downloading asset: ${asset.name}`);

				// Download all URLs for this asset
				for (const url of asset.urls) {
					try {
						const downloadedFile = await this.wgetService.download({
							url,
							target: releaseFolder,
							onProgress: (progress) => {
								this.logger.trace(
									`Download progress for ${url}: ${progress.progress}%`,
								);
							},
						});
						downloadedFiles.push(downloadedFile);
						this.logger.info(`Downloaded file: ${downloadedFile}`);
					} catch (error) {
						this.logger.error(`Failed to download ${url}: ${error}`);
						// Update status to DOWNLOAD_FAILED
						db.update(T_MOD_RELEASE_ASSETS)
							.set({ status: AssetStatus.DOWNLOAD_FAILED })
							.where(eq(T_MOD_RELEASE_ASSETS.id, asset.id))
							.run();
						throw error;
					}
				}

				// Update status to DOWNLOADED
				db.update(T_MOD_RELEASE_ASSETS)
					.set({ status: AssetStatus.DOWNLOADED })
					.where(eq(T_MOD_RELEASE_ASSETS.id, asset.id))
					.run();

				this.logger.debug(`Asset downloaded successfully: ${asset.name}`);
		}

		this.logger.info(`All assets downloaded for release: ${releaseId}`);

		// Phase 2: Extract archives
		const archiveAssets = assets.filter((asset) => asset.isArchive);

		if (archiveAssets.length === 0) {
			this.logger.info(`No archives to extract for release: ${releaseId}`);
			return;
		}

		this.logger.info(
			`Extracting ${archiveAssets.length} archives for release: ${releaseId}`,
		);

		for (const asset of archiveAssets) {
			// Update status to EXTRACTING
			db.update(T_MOD_RELEASE_ASSETS)
				.set({ status: AssetStatus.EXTRACTING })
				.where(eq(T_MOD_RELEASE_ASSETS.id, asset.id))
				.run();

			this.logger.debug(`Extracting asset: ${asset.name}`);

			// Extract all archives for this asset
			for (const url of asset.urls) {
				const filename = basename(url);
				const archivePath = join(releaseFolder, filename);
				const logFilePath = join(releaseFolder, `${filename}.log`);

				let logStream: ReturnType<typeof createWriteStream> | undefined;
				try {
					// Create log file stream
					logStream = createWriteStream(logFilePath, { flags: "w" });

					await this.sevenzipService.extract({
						archivePath,
						targetDir: releaseFolder,
						onProgress: (progress) => {
							const logMessage = `[${new Date().toISOString()}] Extraction progress: ${progress.progress}%${progress.summary ? ` - ${progress.summary}` : ""}\n`;
							logStream?.write(logMessage);
							this.logger.trace(
								`Extract progress for ${filename}: ${progress.progress}%`,
							);
						},
					});

					this.logger.info(`Extracted archive: ${archivePath}`);
				} catch (error) {
					this.logger.error(`Failed to extract ${archivePath}: ${error}`);
					// Update status to EXTRACTION_FAILED
					db.update(T_MOD_RELEASE_ASSETS)
						.set({ status: AssetStatus.EXTRACTION_FAILED })
						.where(eq(T_MOD_RELEASE_ASSETS.id, asset.id))
						.run();
					throw error;
				} finally {
					// Ensure log stream is always closed
					logStream?.end();
				}
			}

			// Update status to EXTRACTED
			db.update(T_MOD_RELEASE_ASSETS)
				.set({ status: AssetStatus.EXTRACTED })
				.where(eq(T_MOD_RELEASE_ASSETS.id, asset.id))
				.run();

			this.logger.debug(`Asset extracted successfully: ${asset.name}`);
		}

		this.logger.info(`All archives extracted for release: ${releaseId}`);
	}
}

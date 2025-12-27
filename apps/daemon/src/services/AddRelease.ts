import { mkdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { getLogger } from "log4js";
import type { DownloadQueue } from "../queues/DownloadQueue.ts";
import type { ExtractQueue } from "../queues/ExtractQueue.ts";
import type { GetReleaseAssetsForReleaseId } from "../repository/GetReleaseAssetsForReleaseId.ts";
import type { SaveModAndReleaseData } from "../repository/SaveModAndReleaseData.ts";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import type { ResolveReleaseDir } from "./ResolveReleaseDir.ts";

const logger = getLogger("AddRelease");

export class AddRelease {
	constructor(
		protected deps: {
			saveModAndReleaseData: SaveModAndReleaseData;
			getReleaseAssetsForReleaseId: GetReleaseAssetsForReleaseId;
			resolveReleaseDir: ResolveReleaseDir;
			downloadQueue: DownloadQueue;
			extractQueue: ExtractQueue;
		},
	) {}

	async execute(data: ModAndReleaseData): Promise<void> {
		logger.info(`Adding releaseId: ${data.releaseId}`);

		// Insert release and related data in a transaction
		this.deps.saveModAndReleaseData.execute(data);

		// Prepare release folder and queues
		const releaseFolder = this.deps.resolveReleaseDir.execute(data.releaseId);
		await mkdir(releaseFolder, { recursive: true });

		// Enqueue download and extract jobs for each asset
		const assets = this.deps.getReleaseAssetsForReleaseId.execute(data.releaseId);

		for (const asset of assets) {
			logger.debug(`Downloading asset: ${asset.name}`);

			const downloadJobIds: string[] = [];

			for (const [idx, url] of asset.urls.entries()) {
				const downloadJobId = `${asset.id}:${idx}`;
				logger.debug(`Pushing download job for URL: ${url}`);
				this.deps.downloadQueue.pushJob(data.releaseId, asset.id, downloadJobId, url, releaseFolder);
				downloadJobIds.push(downloadJobId);
			}

			// If the asset is an archive, create an extract job that depends on all download jobs
			if (asset.isArchive && asset.urls.length > 0) {
				// For multipart archives, the first file is typically the main archive
				const firstUrl = asset.urls[0] as string;
				const archivePath = join(releaseFolder, decodeURIComponent(basename(firstUrl)));

				logger.debug(
					`Pushing extract job for archive: ${archivePath} with ${downloadJobIds.length} download dependencies`,
				);
				this.deps.extractQueue.pushJob(
					data.releaseId,
					asset.id,
					`extract:${asset.id}`,
					archivePath,
					releaseFolder,
					downloadJobIds,
				);
			}

			// Log warning if asset is marked as archive but has no URLs
			if (asset.isArchive && asset.urls.length === 0) {
				logger.warn(
					`Asset "${asset.name}" (id: ${asset.id}) is marked as archive but has no URLs. No extract job will be created.`,
				);
			}
		}

		logger.info(`Successfully added releaseId: ${data.releaseId}`);
	}
}

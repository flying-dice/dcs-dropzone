import { basename, join } from "node:path";
import { getLogger } from "log4js";
import type { AssetStatus } from "../enums/AssetStatus.ts";
import { inferAssetStatusFromJobs } from "../functions/inferAssetStatusFromJobs.ts";
import { inferReleaseStatusFromAssets } from "../functions/inferReleaseStatusFromAssets.ts";
import { totalPercentProgress } from "../functions/totalPercentProgress.ts";
import type { DownloadQueue } from "../ports/DownloadQueue.ts";
import type { ExtractQueue } from "../ports/ExtractQueue.ts";
import type { FileSystem } from "../ports/FileSystem.ts";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import { ModAndReleaseData, type ModReleaseAssetStatusData } from "../schemas/ModAndReleaseData.ts";
import type { PathResolver } from "./PathResolver.ts";

const logger = getLogger("ReleaseCatalog");

type Deps = {
	pathResolver: PathResolver;
	downloadQueue: DownloadQueue;
	extractQueue: ExtractQueue;
	releaseRepository: ReleaseRepository;
	fileSystem: FileSystem;
};

export class ReleaseCatalog {
	constructor(protected deps: Deps) {}

	add(data: ModAndReleaseData) {
		logger.info(`Adding releaseId: ${data.releaseId}`);

		// Insert release and related data in a transaction
		this.deps.releaseRepository.saveRelease(data);

		// Prepare release folder and queues
		const releaseFolder = this.deps.pathResolver.resolveReleasePath(data.releaseId);
		this.deps.fileSystem.ensureDir(releaseFolder);

		// Enqueue download and extract jobs for each asset
		const assets = this.deps.releaseRepository.getReleaseAssetsForRelease(data.releaseId);

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

	remove(releaseId: string): void {
		this.deps.downloadQueue.cancelJobsForRelease(releaseId);
		this.deps.extractQueue.cancelJobsForRelease(releaseId);

		const releaseFolder = this.deps.pathResolver.resolveReleasePath(releaseId);
		this.deps.fileSystem.removeDir(releaseFolder);

		this.deps.releaseRepository.deleteRelease(releaseId);
	}

	getAllReleasesWithStatus(): ModAndReleaseData[] {
		const releases: ModAndReleaseData[] = [];

		for (const release of this.deps.releaseRepository.getAllReleases()) {
			const assets = this.deps.releaseRepository.getReleaseAssetsForRelease(release.releaseId).map((asset) => {
				const statusData = this.getJobDataForAsset(asset.id);

				return {
					...asset,
					statusData,
				};
			});

			const symbolicLinks = this.deps.releaseRepository.getSymbolicLinksForRelease(release.releaseId);
			const missionScripts = this.deps.releaseRepository.getMissionScriptsForRelease(release.releaseId);

			releases.push({
				...release,
				assets,
				symbolicLinks,
				missionScripts,
				status: inferReleaseStatusFromAssets(
					assets.map((it) => it.statusData.status),
					symbolicLinks,
				),
				overallPercentProgress: totalPercentProgress(assets.flatMap((it) => it.statusData.overallPercentProgress)),
			});
		}

		return ModAndReleaseData.array().parse(releases);
	}

	private getJobDataForAsset(releaseAssetId: string): ModReleaseAssetStatusData {
		const downloadJobs = this.deps.downloadQueue.getJobsForReleaseAssetId(releaseAssetId);
		const extractJobs = this.deps.extractQueue.getJobsForReleaseAssetId(releaseAssetId);

		const downloadPercentProgress = totalPercentProgress(downloadJobs.map((it) => it.progressPercent));

		const extractPercentProgress = totalPercentProgress(extractJobs.map((it) => it.progressPercent));

		const overallPercentProgress = totalPercentProgress([
			...downloadJobs.map((it) => it.progressPercent),
			...extractJobs.map((it) => it.progressPercent),
		]);

		const status: AssetStatus = inferAssetStatusFromJobs(downloadJobs, extractJobs);

		return {
			downloadPercentProgress,
			extractPercentProgress,
			overallPercentProgress,
			status,
		};
	}
}

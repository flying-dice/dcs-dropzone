import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import { AssetStatus } from "../enums/AssetStatus.ts";
import { inferReleaseStatusFromAssets } from "../functions/inferReleaseStatusFromAssets.ts";
import { totalPercentProgress } from "../functions/totalPercentProgress.ts";
import type { FileSystem } from "../ports/FileSystem.ts";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import type { PathResolver } from "./PathResolver.ts";
import type { ReleaseAssetManager } from "./ReleaseAssetManager.ts";

const logger = getLogger("ReleaseCatalog");

type Deps = {
	pathResolver: PathResolver;
	releaseRepository: ReleaseRepository;
	fileSystem: FileSystem;
	releaseAssetManager: ReleaseAssetManager;
};

export class ReleaseCatalog {
	constructor(protected deps: Deps) {}

	@Log(logger)
	add(data: ModAndReleaseData) {
		logger.info(`Adding releaseId: ${data.releaseId}`);

		this.deps.releaseRepository.saveRelease(data);
		this.deps.releaseAssetManager.addRelease(data.releaseId);

		logger.info(`Successfully added releaseId: ${data.releaseId}`);
	}

	@Log(logger)
	remove(releaseId: string): void {
		this.deps.releaseAssetManager.removeRelease(releaseId);
		this.deps.releaseRepository.deleteRelease(releaseId);
	}

	@Log(logger)
	getAllReleasesWithStatus(): ModAndReleaseData[] {
		const releases: ModAndReleaseData[] = [];

		for (const release of this.deps.releaseRepository.getAllReleases()) {
			const jobDataByAssetId = this.deps.releaseAssetManager.getProgressReportForAssets(release.releaseId);

			const assets = this.deps.releaseRepository.getReleaseAssetsForRelease(release.releaseId).map((asset) => {
				const statusData = jobDataByAssetId[asset.id];

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
					assets.map((it) => it.statusData?.status ?? AssetStatus.PENDING),
					symbolicLinks,
				),
				overallPercentProgress: totalPercentProgress(
					assets.flatMap((it) => it.statusData?.overallPercentProgress ?? 0),
				),
			});
		}

		return ModAndReleaseData.array().parse(releases);
	}
}

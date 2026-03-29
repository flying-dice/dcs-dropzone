import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { AssetStatus } from "../enums/AssetStatus.ts";
import { inferReleaseStatusFromAssets } from "../functions/inferReleaseStatusFromAssets.ts";
import { totalPercentProgress } from "../functions/totalPercentProgress.ts";
import type { FileSystem } from "../ports/FileSystem.ts";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import type { DropzoneModsDirNotConfigured, PathResolver } from "./PathResolver.ts";
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

	add(data: ModAndReleaseData): Result<void, DropzoneModsDirNotConfigured> {
		logger.info(`Adding releaseId: ${data.releaseId}`);

		// Verify dropzone mods directory is configured before persisting to prevent orphaned records
		const pathCheck = this.deps.pathResolver.resolveReleasePath(data.releaseId);
		if (pathCheck.isErr()) return err(pathCheck.error);

		this.deps.releaseRepository.saveRelease(data);
		const addResult = this.deps.releaseAssetManager.addRelease(data.releaseId);
		if (addResult.isErr()) return err(addResult.error);

		logger.info(`Successfully added releaseId: ${data.releaseId}`);
		return ok(undefined);
	}

	remove(releaseId: string): void {
		this.deps.releaseAssetManager.removeRelease(releaseId);
		this.deps.releaseRepository.deleteRelease(releaseId);
	}

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

			let symlinkIntegrityValid = true;
			if (release.enabled && symbolicLinks.length > 0) {
				symlinkIntegrityValid = symbolicLinks.every(
					(link) => link.installedPath !== null && this.deps.fileSystem.exists(link.installedPath),
				);
			}

			releases.push({
				...release,
				assets,
				symbolicLinks,
				missionScripts,
				status: inferReleaseStatusFromAssets(
					assets.map((it) => it.statusData?.status ?? AssetStatus.PENDING),
					release.enabled,
					symlinkIntegrityValid,
				),
				overallPercentProgress: totalPercentProgress(
					assets.flatMap((it) => it.statusData?.overallPercentProgress ?? 0),
				),
			});
		}

		return ModAndReleaseData.array().parse(releases);
	}
}

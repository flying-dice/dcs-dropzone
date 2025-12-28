import type { AssetStatus } from "../enums/AssetStatus.ts";
import { inferAssetStatusFromJobs } from "../functions/inferAssetStatusFromJobs.ts";
import { inferReleaseStatusFromAssets } from "../functions/inferReleaseStatusFromAssets.ts";
import { totalPercentProgress } from "../functions/totalPercentProgress.ts";
import type { GetAllReleases } from "../repository/GetAllReleases.ts";
import type { GetDownloadJobsForReleaseAssetId } from "../repository/GetDownloadJobsForReleaseAssetId.ts";
import type { GetExtractJobsForReleaseAssetId } from "../repository/GetExtractJobsForReleaseAssetId.ts";
import type { GetMissionScriptsForReleaseId } from "../repository/GetMissionScriptsForReleaseId.ts";
import type { GetReleaseAssetsForReleaseId } from "../repository/GetReleaseAssetsForReleaseId.ts";
import type { GetSymbolicLinksForReleaseId } from "../repository/GetSymbolicLinksForReleaseId.ts";
import { ModAndReleaseData, type ModReleaseAssetStatusData } from "../schemas/ModAndReleaseData.ts";

export class GetAllDaemonReleases {
	constructor(
		protected deps: {
			getDownloadJobsForReleaseAssetId: GetDownloadJobsForReleaseAssetId;
			getExtractJobsForReleaseAssetId: GetExtractJobsForReleaseAssetId;
			getReleaseAssetsForReleaseId: GetReleaseAssetsForReleaseId;
			getAllReleases: GetAllReleases;
			getSymbolicLinksForReleaseId: GetSymbolicLinksForReleaseId;
			getMissionScriptsForReleaseId: GetMissionScriptsForReleaseId;
		},
	) {}

	execute(): ModAndReleaseData[] {
		const releases: ModAndReleaseData[] = [];

		for (const release of this.deps.getAllReleases.execute()) {
			const assets = this.deps.getReleaseAssetsForReleaseId.execute(release.releaseId).map((asset) => {
				const statusData = this.getJobDataForAsset(asset.id);

				return {
					...asset,
					statusData,
				};
			});

			const symbolicLinks = this.deps.getSymbolicLinksForReleaseId.execute(release.releaseId);
			const missionScripts = this.deps.getMissionScriptsForReleaseId.execute(release.releaseId);

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
		const downloadJobs = this.deps.getDownloadJobsForReleaseAssetId.execute(releaseAssetId);
		const extractJobs = this.deps.getExtractJobsForReleaseAssetId.execute(releaseAssetId);

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

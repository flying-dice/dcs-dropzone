import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import {
	T_DOWNLOAD_QUEUE,
	T_EXTRACT_QUEUE,
	T_MOD_RELEASE_ASSETS,
	T_MOD_RELEASE_MISSION_SCRIPTS,
	T_MOD_RELEASE_SYMBOLIC_LINKS,
	T_MOD_RELEASES,
} from "../database/schema.ts";
import type { AssetStatus } from "../enums/AssetStatus.ts";
import { inferAssetStatusFromJobs } from "../functions/inferAssetStatusFromJobs.ts";
import { inferReleaseStatusFromAssets } from "../functions/inferReleaseStatusFromAssets.ts";
import { totalPercentProgress } from "../functions/totalPercentProgress.ts";
import { ModAndReleaseData, type ModReleaseAssetStatusData } from "../schemas/ModAndReleaseData.ts";

export type GetAllDaemonReleasesQuery = {
	db: BunSQLiteDatabase;
};
export type GetAllDaemonReleasesResult = ModAndReleaseData[];

function getJobDataForAsset(
	db: BunSQLiteDatabase,
	releaseAsset: typeof T_MOD_RELEASE_ASSETS.$inferSelect,
): ModReleaseAssetStatusData {
	const downloadJobs = db
		.select()
		.from(T_DOWNLOAD_QUEUE)
		.where(eq(T_DOWNLOAD_QUEUE.releaseAssetId, releaseAsset.id))
		.all();
	const extractJobs = db
		.select()
		.from(T_EXTRACT_QUEUE)
		.where(eq(T_EXTRACT_QUEUE.releaseAssetId, releaseAsset.id))
		.all();

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

export default function (query: GetAllDaemonReleasesQuery): GetAllDaemonReleasesResult {
	const { db } = query;
	const releases: ModAndReleaseData[] = [];

	for (const release of db.select().from(T_MOD_RELEASES).all()) {
		const assets = db
			.select()
			.from(T_MOD_RELEASE_ASSETS)
			.where(eq(T_MOD_RELEASE_ASSETS.releaseId, release.releaseId))
			.all()
			.map((asset) => {
				const statusData = getJobDataForAsset(db, asset);

				return {
					...asset,
					statusData,
				};
			});

		const symbolicLinks = db
			.select()
			.from(T_MOD_RELEASE_SYMBOLIC_LINKS)
			.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.releaseId, release.releaseId))
			.all();

		const missionScripts = db
			.select()
			.from(T_MOD_RELEASE_MISSION_SCRIPTS)
			.where(eq(T_MOD_RELEASE_MISSION_SCRIPTS.releaseId, release.releaseId))
			.all();

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

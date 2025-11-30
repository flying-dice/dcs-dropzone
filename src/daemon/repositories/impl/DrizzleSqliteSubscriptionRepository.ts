import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { AssetStatus } from "../../../common/data.ts";
import { inferAssetStatusFromJobs } from "../../../common/inferAssetStatusFromJobs.ts";
import { inferReleaseStatusFromAssets } from "../../../common/inferReleaseStatusFromAssets.ts";
import { totalPercentProgress } from "../../../common/totalPercentProgress.ts";
import {
	T_DOWNLOAD_QUEUE,
	T_EXTRACT_QUEUE,
	T_MOD_RELEASE_ASSETS,
	T_MOD_RELEASE_MISSION_SCRIPTS,
	T_MOD_RELEASE_SYMBOLIC_LINKS,
	T_MOD_RELEASES,
} from "../../database/schema.ts";
import {
	ModAndReleaseData,
	type ModReleaseAssetStatusData,
} from "../../schemas/ModAndReleaseData.ts";
import type { SubscriptionRepository } from "../SubscriptionRepository.ts";

export class DrizzleSqliteSubscriptionRepository
	implements SubscriptionRepository
{
	constructor(private readonly db: BunSQLiteDatabase) {}

	getAll(): ModAndReleaseData[] {
		const releases: ModAndReleaseData[] = [];

		for (const release of this.db.select().from(T_MOD_RELEASES).all()) {
			const assets = this.db
				.select()
				.from(T_MOD_RELEASE_ASSETS)
				.where(eq(T_MOD_RELEASE_ASSETS.releaseId, release.releaseId))
				.all()
				.map((asset) => {
					const statusData = this.getJobDataForAsset(asset);

					return {
						...asset,
						statusData,
					};
				});

			const symbolicLinks = this.db
				.select()
				.from(T_MOD_RELEASE_SYMBOLIC_LINKS)
				.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.releaseId, release.releaseId))
				.all();

			const missionScripts = this.db
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
			});
		}

		return ModAndReleaseData.array().parse(releases);
	}

	saveRelease(data: ModAndReleaseData): void {
		this.db.transaction(
			(trx) => {
				trx
					.insert(T_MOD_RELEASES)
					.values({
						releaseId: data.releaseId,
						modId: data.modId,
						modName: data.modName,
						version: data.version,
						dependencies: data.dependencies,
					})
					.run();

				if (data.assets && data.assets.length > 0) {
					trx
						.insert(T_MOD_RELEASE_ASSETS)
						.values(
							data.assets.map((asset, idx) => ({
								id: `${data.releaseId}:${idx}`,
								releaseId: data.releaseId,
								name: asset.name,
								isArchive: asset.isArchive,
								urls: asset.urls,
							})),
						)
						.run();
				}

				if (data.symbolicLinks && data.symbolicLinks.length > 0) {
					trx
						.insert(T_MOD_RELEASE_SYMBOLIC_LINKS)
						.values(
							data.symbolicLinks.map((link, idx) => ({
								id: `${data.releaseId}:${idx}`,
								releaseId: data.releaseId,
								name: link.name,
								src: link.src,
								dest: link.dest,
								destRoot: link.destRoot,
							})),
						)
						.run();
				}

				if (data.missionScripts && data.missionScripts.length > 0) {
					trx
						.insert(T_MOD_RELEASE_MISSION_SCRIPTS)
						.values(
							data.missionScripts.map((script, idx) => ({
								id: `${data.releaseId}:${idx}`,
								releaseId: data.releaseId,
								name: script.name,
								purpose: script.purpose,
								runOn: script.runOn,
								path: script.path,
								root: script.root,
							})),
						)
						.run();
				}
			},
			{ behavior: "immediate" },
		);
	}

	deleteByReleaseId(releaseId: string): void {
		this.db.transaction(
			(trx) => {
				trx
					.delete(T_MOD_RELEASE_ASSETS)
					.where(eq(T_MOD_RELEASE_ASSETS.releaseId, releaseId))
					.run();

				trx
					.delete(T_MOD_RELEASE_SYMBOLIC_LINKS)
					.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.releaseId, releaseId))
					.run();

				trx
					.delete(T_MOD_RELEASE_MISSION_SCRIPTS)
					.where(eq(T_MOD_RELEASE_MISSION_SCRIPTS.releaseId, releaseId))
					.run();

				trx
					.delete(T_MOD_RELEASES)
					.where(eq(T_MOD_RELEASES.releaseId, releaseId))
					.run();
			},
			{ behavior: "immediate" },
		);
	}

	private getJobDataForAsset(
		releaseAsset: typeof T_MOD_RELEASE_ASSETS.$inferSelect,
	): ModReleaseAssetStatusData {
		const downloadJobs = this.db
			.select()
			.from(T_DOWNLOAD_QUEUE)
			.where(eq(T_DOWNLOAD_QUEUE.releaseAssetId, releaseAsset.id))
			.all();
		const extractJobs = this.db
			.select()
			.from(T_EXTRACT_QUEUE)
			.where(eq(T_EXTRACT_QUEUE.releaseAssetId, releaseAsset.id))
			.all();

		const downloadPercentProgress = totalPercentProgress(
			downloadJobs.map((it) => it.progressPercent),
		);

		const extractPercentProgress = totalPercentProgress(
			extractJobs.map((it) => it.progressPercent),
		);

		const overallPercentProgress = totalPercentProgress([
			...downloadJobs.map((it) => it.progressPercent),
			...extractJobs.map((it) => it.progressPercent),
		]);

		const status: AssetStatus = inferAssetStatusFromJobs(
			downloadJobs,
			extractJobs,
		);

		return {
			downloadPercentProgress,
			extractPercentProgress,
			overallPercentProgress,
			status,
		};
	}
}

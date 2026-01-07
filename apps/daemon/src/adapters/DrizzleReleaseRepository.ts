import { Log } from "@packages/decorators";
import type { JobRecord } from "@packages/queue";
import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { getLogger } from "log4js";
import type { MissionScriptRunOn } from "webapp";
import type { ReleaseRepository } from "../application/ports/ReleaseRepository.ts";
import type { MissionScript } from "../application/schemas/MissionScript.ts";
import type { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";
import {
	T_JOBS_FOR_RELEASE,
	T_MOD_RELEASE_ASSETS,
	T_MOD_RELEASE_MISSION_SCRIPTS,
	T_MOD_RELEASE_SYMBOLIC_LINKS,
	T_MOD_RELEASES,
} from "../database/schema.ts";

const logger = getLogger("DrizzleReleaseRepository");

export class DrizzleReleaseRepository implements ReleaseRepository {
	protected readonly db: BunSQLiteDatabase;

	constructor(deps: { db: BunSQLiteDatabase }) {
		this.db = deps.db;
	}

	@Log(logger)
	deleteRelease(releaseId: string): void {
		this.db.transaction(
			(trx) => {
				trx.delete(T_MOD_RELEASE_ASSETS).where(eq(T_MOD_RELEASE_ASSETS.releaseId, releaseId)).run();

				trx.delete(T_MOD_RELEASE_SYMBOLIC_LINKS).where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.releaseId, releaseId)).run();

				trx.delete(T_MOD_RELEASE_MISSION_SCRIPTS).where(eq(T_MOD_RELEASE_MISSION_SCRIPTS.releaseId, releaseId)).run();

				trx.delete(T_MOD_RELEASES).where(eq(T_MOD_RELEASES.releaseId, releaseId)).run();
			},
			{ behavior: "immediate" },
		);
	}

	@Log(logger)
	getAllReleases() {
		return this.db.select().from(T_MOD_RELEASES).all();
	}

	@Log(logger)
	getMissionScriptsByRunOn(runOn: MissionScriptRunOn) {
		return this.db
			.select({
				modName: T_MOD_RELEASES.modName,
				modVersion: T_MOD_RELEASES.version,
				path: T_MOD_RELEASE_MISSION_SCRIPTS.path,
				pathRoot: T_MOD_RELEASE_MISSION_SCRIPTS.root,
			})
			.from(T_MOD_RELEASE_MISSION_SCRIPTS)
			.innerJoin(T_MOD_RELEASES, eq(T_MOD_RELEASE_MISSION_SCRIPTS.releaseId, T_MOD_RELEASES.releaseId))
			.where(eq(T_MOD_RELEASE_MISSION_SCRIPTS.runOn, runOn))
			.all();
	}

	@Log(logger)
	getReleaseAssetsForRelease(releaseId: string) {
		return this.db.select().from(T_MOD_RELEASE_ASSETS).where(eq(T_MOD_RELEASE_ASSETS.releaseId, releaseId)).all();
	}

	@Log(logger)
	getSymbolicLinksForRelease(releaseId: string) {
		return this.db
			.select()
			.from(T_MOD_RELEASE_SYMBOLIC_LINKS)
			.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.releaseId, releaseId))
			.all();
	}

	@Log(logger)
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
						versionHash: data.versionHash,
						dependencies: data.dependencies,
					})
					.run();

				if (data.assets && data.assets.length > 0) {
					trx
						.insert(T_MOD_RELEASE_ASSETS)
						.values(
							data.assets.map((asset) => ({
								id: asset.id,
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
							data.symbolicLinks.map((link) => ({
								id: link.id,
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
							data.missionScripts.map((script) => ({
								id: script.id,
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

	@Log(logger)
	setInstalledPathForSymbolicLink(symbolicLinkId: string, installedPath: string | null): void {
		this.db
			.update(T_MOD_RELEASE_SYMBOLIC_LINKS)
			.set({ installedPath })
			.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.id, symbolicLinkId))
			.run();
	}

	@Log(logger)
	getMissionScriptsForRelease(releaseId: string): MissionScript[] {
		return this.db
			.select()
			.from(T_MOD_RELEASE_MISSION_SCRIPTS)
			.where(eq(T_MOD_RELEASE_MISSION_SCRIPTS.releaseId, releaseId))
			.all();
	}

	@Log(logger)
	getJobIdsForRelease(releaseId: string): JobRecord["jobId"][] {
		const all = this.db.select().from(T_JOBS_FOR_RELEASE).where(eq(T_JOBS_FOR_RELEASE.releaseId, releaseId)).all();
		return all.map((r) => r.jobId);
	}

	@Log(logger)
	addJobForRelease(releaseId: string, jobId: JobRecord["jobId"]) {
		this.db
			.insert(T_JOBS_FOR_RELEASE)
			.values({
				releaseId,
				jobId,
			})
			.run();
	}

	@Log(logger)
	clearJobsForRelease(releaseId: string): void {
		this.db.delete(T_JOBS_FOR_RELEASE).where(eq(T_JOBS_FOR_RELEASE.releaseId, releaseId)).run();
	}
}

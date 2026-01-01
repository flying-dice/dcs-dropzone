import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import type { ReleaseRepository } from "../application/ports/ReleaseRepository.ts";
import type { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";
import {
	T_MOD_RELEASE_ASSETS,
	T_MOD_RELEASE_MISSION_SCRIPTS,
	T_MOD_RELEASE_SYMBOLIC_LINKS,
	T_MOD_RELEASES,
} from "../database/schema.ts";

export class DrizzleReleaseRepository implements ReleaseRepository {
	protected readonly db: BunSQLiteDatabase;

	constructor(deps: { db: BunSQLiteDatabase }) {
		this.db = deps.db;
	}

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

	getAllReleases() {
		return this.db.select().from(T_MOD_RELEASES).all();
	}

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

	getReleaseAssetsForRelease(releaseId: string) {
		return this.db.select().from(T_MOD_RELEASE_ASSETS).where(eq(T_MOD_RELEASE_ASSETS.releaseId, releaseId)).all();
	}

	getSymbolicLinksForRelease(releaseId: string) {
		return this.db
			.select()
			.from(T_MOD_RELEASE_SYMBOLIC_LINKS)
			.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.releaseId, releaseId))
			.all();
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
							data.symbolicLinks.map((link, idx) => ({
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
							data.missionScripts.map((script, idx) => ({
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

	setInstalledPathForSymbolicLink(symbolicLinkId: string, installedPath: string | null): void {
		this.db
			.update(T_MOD_RELEASE_SYMBOLIC_LINKS)
			.set({ installedPath })
			.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.id, symbolicLinkId))
			.run();
	}

	getMissionScriptsForRelease(releaseId: string): {
		id: string;
		releaseId: string;
		name: string;
		purpose: string;
		path: string;
		root: SymbolicLinkDestRoot;
		runOn: MissionScriptRunOn;
		installedPath: string | null;
	}[] {
		return this.db
			.select()
			.from(T_MOD_RELEASE_MISSION_SCRIPTS)
			.where(eq(T_MOD_RELEASE_MISSION_SCRIPTS.releaseId, releaseId))
			.all();
	}
}

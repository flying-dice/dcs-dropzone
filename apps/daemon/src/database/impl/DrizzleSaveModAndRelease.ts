import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { SaveModAndRelease } from "../../repository/SaveModAndRelease.ts";
import type { ModAndReleaseData } from "../../schemas/ModAndReleaseData.ts";
import {
	T_MOD_RELEASE_ASSETS,
	T_MOD_RELEASE_MISSION_SCRIPTS,
	T_MOD_RELEASE_SYMBOLIC_LINKS,
	T_MOD_RELEASES,
} from "../schema.ts";

export class DrizzleSaveModAndRelease implements SaveModAndRelease {
	constructor(
		protected deps: {
			db: BunSQLiteDatabase;
		},
	) {}

	execute(data: ModAndReleaseData): void {
		this.deps.db.transaction(
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
}

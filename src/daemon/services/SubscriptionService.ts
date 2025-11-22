import { eq } from "drizzle-orm";
import { db } from "../database";
import {
	T_MOD_RELEASE_ASSETS,
	T_MOD_RELEASE_MISSION_SCRIPTS,
	T_MOD_RELEASE_SYMBOLIC_LINKS,
	T_MOD_RELEASES,
} from "../database/schema.ts";
import Logger from "../Logger.ts";
import type { ModReleaseData } from "../schemas/ModAndReleaseData.ts";

const logger = Logger.getLogger("SubscriptionService");

export class SubscriptionService {
	getAllSubscriptions(): { modId: string; releaseId: string }[] {
		return db
			.select({
				releaseId: T_MOD_RELEASES.releaseId,
				modId: T_MOD_RELEASES.modId,
			})
			.from(T_MOD_RELEASES)
			.all();
	}

	removeSubscription(releaseId: string) {
		logger.info(`Removing subscription for releaseId: ${releaseId}`);
		db.transaction(
			(db) => {
				db.delete(T_MOD_RELEASE_ASSETS)
					.where(eq(T_MOD_RELEASE_ASSETS.releaseId, releaseId))
					.run();

				db.delete(T_MOD_RELEASE_SYMBOLIC_LINKS)
					.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.releaseId, releaseId))
					.run();

				db.delete(T_MOD_RELEASE_MISSION_SCRIPTS)
					.where(eq(T_MOD_RELEASE_MISSION_SCRIPTS.releaseId, releaseId))
					.run();

				db.delete(T_MOD_RELEASES)
					.where(eq(T_MOD_RELEASES.releaseId, releaseId))
					.run();
			},
			{ behavior: "immediate" },
		);

		logger.info(
			`Successfully removed subscription for releaseId: ${releaseId}`,
		);
	}

	subscribeToRelease(data: ModReleaseData) {
		logger.info(
			`Subscribing to mod: ${data.modName} (release: ${data.version})`,
		);

		db.transaction(
			(db) => {
				db.insert(T_MOD_RELEASES)
					.values({
						releaseId: data.releaseId,
						modId: data.modId,
						modName: data.modName,
						version: data.version,
					})
					.run();

				if (data.assets && data.assets.length > 0) {
					db.insert(T_MOD_RELEASE_ASSETS)
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
					db.insert(T_MOD_RELEASE_SYMBOLIC_LINKS)
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
					db.insert(T_MOD_RELEASE_MISSION_SCRIPTS)
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

		logger.info(
			`Successfully subscribed to mod: ${data.modName} (release: ${data.version})`,
		);
	}
}

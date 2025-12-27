import { exists, rm } from "node:fs/promises";
import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { getLogger } from "log4js";
import {
	T_MOD_RELEASE_ASSETS,
	T_MOD_RELEASE_MISSION_SCRIPTS,
	T_MOD_RELEASE_SYMBOLIC_LINKS,
	T_MOD_RELEASES,
} from "../database/schema.ts";
import type { DownloadQueue } from "../queues/DownloadQueue.ts";
import type { ExtractQueue } from "../queues/ExtractQueue.ts";
import type { PathService } from "./PathService.ts";

export type RemoveReleaseCommand = {
	releaseId: string;
	db: BunSQLiteDatabase;
	disableReleaseHandler: (releaseId: string) => void;
	downloadQueue: DownloadQueue;
	extractQueue: ExtractQueue;
	pathService: PathService;
};

export type RemoveReleaseResult = void;

const logger = getLogger("RemoveReleaseCommand");

export default async function (command: RemoveReleaseCommand): Promise<RemoveReleaseResult> {
	const { releaseId, disableReleaseHandler, db, downloadQueue, extractQueue, pathService } = command;
	logger.info(`Removing releaseId: ${releaseId}`);

	// Disable the release if its enabled
	disableReleaseHandler(releaseId);

	// Cancel any pending jobs in the queues
	downloadQueue.cancelJobsForRelease(releaseId);
	extractQueue.cancelJobsForRelease(releaseId);

	// Remove the release folder from the filesystem
	const releaseFolder = pathService.getReleaseDir(releaseId);
	if (await exists(releaseFolder)) {
		await rm(releaseFolder, { recursive: true, force: true });
		logger.info(`Removed release folder: ${releaseFolder}`);
	} else {
		logger.info(`Release folder does not exist: ${releaseFolder}`);
	}

	// Remove database entries related to the release
	db.transaction(
		(trx) => {
			trx.delete(T_MOD_RELEASE_ASSETS).where(eq(T_MOD_RELEASE_ASSETS.releaseId, releaseId)).run();

			trx.delete(T_MOD_RELEASE_SYMBOLIC_LINKS).where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.releaseId, releaseId)).run();

			trx.delete(T_MOD_RELEASE_MISSION_SCRIPTS).where(eq(T_MOD_RELEASE_MISSION_SCRIPTS.releaseId, releaseId)).run();

			trx.delete(T_MOD_RELEASES).where(eq(T_MOD_RELEASES.releaseId, releaseId)).run();
		},
		{ behavior: "immediate" },
	);

	logger.info(`Successfully removed releaseId: ${releaseId}`);
}

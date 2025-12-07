import { mkdir } from "node:fs/promises";
import { basename, join } from "node:path";
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
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import type { PathService } from "../services/PathService.ts";

export type AddReleaseCommand = {
	db: BunSQLiteDatabase;
	downloadQueue: DownloadQueue;
	extractQueue: ExtractQueue;
	data: ModAndReleaseData;
	pathService: PathService;
};

export type AddReleaseResult = void;

const logger = getLogger("AddReleaseCommand");

export default async function (command: AddReleaseCommand): Promise<AddReleaseResult> {
	const { db, downloadQueue, extractQueue, data, pathService } = command;
	logger.info(`Adding releaseId: ${data.releaseId}`);

	// Insert release and related data in a transaction
	db.transaction(
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

	// Prepare release folder and queues
	const releaseFolder = pathService.getReleaseDir(data.releaseId);
	await mkdir(releaseFolder, { recursive: true });

	// Enqueue download and extract jobs for each asset
	const assets = db.select().from(T_MOD_RELEASE_ASSETS).where(eq(T_MOD_RELEASE_ASSETS.releaseId, data.releaseId)).all();

	for (const asset of assets) {
		logger.debug(`Downloading asset: ${asset.name}`);

		const downloadJobIds: string[] = [];

		for (const [idx, url] of asset.urls.entries()) {
			const downloadJobId = `${asset.id}:${idx}`;
			logger.debug(`Pushing download job for URL: ${url}`);
			downloadQueue.pushJob(data.releaseId, asset.id, downloadJobId, url, releaseFolder);
			downloadJobIds.push(downloadJobId);
		}

		// If the asset is an archive, create an extract job that depends on all download jobs
		if (asset.isArchive && asset.urls.length > 0) {
			// For multipart archives, the first file is typically the main archive
			const firstUrl = asset.urls[0] as string;
			const archivePath = join(releaseFolder, decodeURIComponent(basename(firstUrl)));

			logger.debug(
				`Pushing extract job for archive: ${archivePath} with ${downloadJobIds.length} download dependencies`,
			);
			extractQueue.pushJob(data.releaseId, asset.id, `extract:${asset.id}`, archivePath, releaseFolder, downloadJobIds);
		}

		// Log warning if asset is marked as archive but has no URLs
		if (asset.isArchive && asset.urls.length === 0) {
			logger.warn(
				`Asset "${asset.name}" (id: ${asset.id}) is marked as archive but has no URLs. No extract job will be created.`,
			);
		}
	}

	logger.info(`Successfully added releaseId: ${data.releaseId}`);
}

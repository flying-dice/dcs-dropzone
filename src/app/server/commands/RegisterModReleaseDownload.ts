import { getLogger } from "log4js";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModReleaseDownload } from "../entities/ModReleaseDownload.ts";
import type { ModReleaseDownloadData } from "../schemas/ModReleaseDownloadData.ts";

const logger = getLogger("RegisterModReleaseDownloadCommand");

export type RegisterModReleaseDownloadCommand = {
	data: ModReleaseDownloadData;
};

export type RegisterModReleaseDownloadResult = ModReleaseDownloadData;

export default async function (command: RegisterModReleaseDownloadCommand): Promise<RegisterModReleaseDownloadResult> {
	const { data } = command;
	logger.debug(data, "ModReleaseDownloadData start");

	await ModReleaseDownload.updateOne({ releaseId: data.releaseId, daemonInstanceId: data.daemonInstanceId }, data, {
		upsert: true,
	}).exec();
	logger.debug(data, "ModReleaseDownloadData registered, rebuilding aggregations");

	const coundReleaseDownloads = await ModReleaseDownload.countDocuments({ releaseId: data.releaseId }).exec();
	const countModDownloads = await ModReleaseDownload.countDocuments({ modId: data.modId }).exec();

	await ModRelease.updateOne({ id: data.releaseId }, { $set: { downloadsCount: coundReleaseDownloads } }).exec();
	await Mod.updateOne({ id: data.modId }, { $set: { downloadsCount: countModDownloads } }).exec();

	return data;
}

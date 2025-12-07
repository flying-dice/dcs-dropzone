import { getLogger } from "log4js";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModVisibility } from "../enums/ModVisibility.ts";
import type { DaemonInstalledVersionsData } from "../schemas/DaemonInstalledVersionsData.ts";
import { ServerMetricsData } from "../schemas/ServerMetricsData.ts";

const logger = getLogger("GetServerMetricsDataQuery");

export type GetServerMetricsDataQuery = {
	daemonInstalledVersions: DaemonInstalledVersionsData[];
};

export type GetServerMetricsDataResult = ServerMetricsData;

export default async function (query: GetServerMetricsDataQuery): Promise<GetServerMetricsDataResult> {
	logger.debug("start");

	const totalMods = await Mod.countDocuments({
		visibility: ModVisibility.PUBLIC,
	}).exec();

	let outdated = 0;

	for (const installedVersion of query.daemonInstalledVersions) {
		const latestRelease = await ModRelease.findOne({
			mod_id: installedVersion.modId,
			visibility: ModVisibility.PUBLIC,
		})
			.sort({ createdAt: "desc" })
			.limit(1)
			.lean()
			.exec();

		if (latestRelease && latestRelease.id !== installedVersion.releaseId) {
			outdated += 1;
		}
	}

	const metricsData: ServerMetricsData = {
		totalMods: totalMods,
		outdated,
	};

	return ServerMetricsData.parse(metricsData);
}

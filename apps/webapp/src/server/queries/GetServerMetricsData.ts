import { getLogger } from "log4js";
import { Mod } from "../entities/Mod.ts";
import { ModVisibility } from "../enums/ModVisibility.ts";
import { ServerMetricsData } from "../schemas/ServerMetricsData.ts";

const logger = getLogger("GetServerMetricsDataQuery");

export type GetServerMetricsDataResult = ServerMetricsData;

export default async function (): Promise<GetServerMetricsDataResult> {
	logger.debug("start");

	const totalMods = await Mod.countDocuments({
		visibility: ModVisibility.PUBLIC,
	}).exec();

	const [{ total }] = await Mod.aggregate([
		{ $match: { visibility: ModVisibility.PUBLIC } },
		{
			$group: {
				_id: null,
				total: { $sum: "$downloadsCount" },
			},
		},
	]);

	const metricsData: ServerMetricsData = {
		totalMods,
		totalDownloads: total || 0,
	};

	return ServerMetricsData.parse(metricsData);
}

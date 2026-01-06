import { getLogger } from "log4js";
import { ModVisibility } from "../application/enums/ModVisibility.ts";
import { ServerMetricsData } from "../application/schemas/ServerMetricsData.ts";
import { Mod } from "../infrastructure/mongo-db/entities/Mod.ts";

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

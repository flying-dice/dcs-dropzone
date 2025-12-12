import { getLogger } from "log4js";
import { Mod } from "../entities/Mod.ts";
import { ModVisibility } from "../enums/ModVisibility.ts";
import { CountTotalPublicModsData } from "../schemas/CountTotalPublicModsData.ts";

const logger = getLogger("GetServerMetricsDataTotalModsQuery");

export type GetCountTotalPublicModsResult = CountTotalPublicModsData;

export default async function (): Promise<GetCountTotalPublicModsResult> {
	logger.debug("start");

	const totalMods = await Mod.countDocuments({
		visibility: ModVisibility.PUBLIC,
	}).exec();

	return CountTotalPublicModsData.parse({ totalMods });
}

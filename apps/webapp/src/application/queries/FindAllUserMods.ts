import { getLogger } from "log4js";
import { ModVisibility } from "../enums/ModVisibility.ts";
import { ModSummary } from "../mongo-db/entities/ModSummary.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import type { UserData } from "../schemas/UserData.ts";
import { UserModsMetaData } from "../schemas/UserModsMetaData.ts";

const logger = getLogger("FindAllUserModsQuery");

export type FindAllUserModsQuery = {
	user: UserData;
};

export type FindAllUserModsResult = {
	data: ModSummaryData[];
	meta: UserModsMetaData;
};

export default async function (query: FindAllUserModsQuery): Promise<FindAllUserModsResult> {
	const { user } = query;

	logger.debug({ userId: user.id }, "findAllUserMods start");

	const countPublished = await ModSummary.countDocuments({
		maintainers: user.id,
		visibility: ModVisibility.PUBLIC,
	});

	logger.debug({ countPublished }, "Counted published mods");

	const docs = await ModSummary.find({ maintainers: user.id }).sort({ createdAt: "desc" }).lean().exec();

	logger.debug({ docs: docs.length, countPublished }, "Fetched all user mods");

	const totalDownloads = await ModSummary.aggregate([
		{ $match: { maintainers: user.id } },
		{
			$group: {
				_id: null,
				total: { $sum: "$downloadsCount" },
			},
		},
	]).exec();

	const meta: UserModsMetaData = {
		published: countPublished,
		totalDownloads: totalDownloads[0]?.total || 0,
	};

	return {
		data: ModSummaryData.array().parse(docs),
		meta: UserModsMetaData.parse(meta),
	};
}

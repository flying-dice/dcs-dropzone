import { getLogger } from "log4js";
import { ModVisibility } from "../../../common/data.ts";
import { ModSummary } from "../entities/ModSummary.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import type { UserData } from "../schemas/UserData.ts";
import { UserModsMetaData } from "../schemas/UserModsMetaData.ts";

const logger = getLogger("UserModService");

export type FindAllUserModsProps = {
	user: UserData;
};

export async function findAllUserMods(
	props: FindAllUserModsProps,
): Promise<{ data: ModSummaryData[]; meta: UserModsMetaData }> {
	logger.debug({ userId: props.user.id }, "findAllUserMods start");

	const countPublished = await ModSummary.countDocuments({
		maintainers: props.user.id,
		visibility: ModVisibility.PUBLIC,
	});

	logger.debug({ countPublished }, "Counted published mods");

	const docs = await ModSummary.find({ maintainers: props.user.id })
		.sort({ createdAt: "desc" })
		.lean()
		.exec();

	logger.debug({ docs: docs.length, countPublished }, "Fetched all user mods");

	const totalDownloads = await ModSummary.aggregate([
		{ $match: { maintainers: props.user.id } },
		{
			$group: {
				_id: null,
				total: { $sum: "$downloadsCount" },
			},
		},
	]).exec();

	const averageRating = await ModSummary.aggregate([
		{ $match: { maintainers: props.user.id } },
		{
			$group: {
				_id: null,
				average: { $avg: "$averageRating" },
			},
		},
	]);

	const meta: UserModsMetaData = {
		published: countPublished,
		totalDownloads: totalDownloads[0]?.total || 0,
		averageRating: averageRating[0]?.average || 0,
	};

	return {
		data: ModSummaryData.array().parse(docs),
		meta: UserModsMetaData.parse(meta),
	};
}

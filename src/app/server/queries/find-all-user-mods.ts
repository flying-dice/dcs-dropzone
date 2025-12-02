import { getLogger } from "log4js";
import { z } from "zod";
import { ModVisibility } from "../../../common/data.ts";
import { ModSummary } from "../entities/ModSummary.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import { UserModsMetaData } from "../schemas/UserModsMetaData.ts";

const logger = getLogger("queries/find-all-user-mods");

const InputSchema = z.object({
	userId: z.string(),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	orm: typeof ModSummary;
}

export default async function (
	input: Input,
	deps: Deps,
): Promise<{ data: ModSummaryData[]; meta: UserModsMetaData }> {
	logger.debug({ userId: input.userId }, "findAllUserMods start");

	const countPublished = await deps.orm.countDocuments({
		maintainers: input.userId,
		visibility: ModVisibility.PUBLIC,
	});

	logger.debug({ countPublished }, "Counted published mods");

	const docs = await deps.orm
		.find({ maintainers: input.userId })
		.sort({ createdAt: "desc" })
		.lean()
		.exec();

	logger.debug({ docs: docs.length, countPublished }, "Fetched all user mods");

	const totalDownloads = await deps.orm
		.aggregate([
			{ $match: { maintainers: input.userId } },
			{
				$group: {
					_id: null,
					total: { $sum: "$downloadsCount" },
				},
			},
		])
		.exec();

	const averageRating = await deps.orm.aggregate([
		{ $match: { maintainers: input.userId } },
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

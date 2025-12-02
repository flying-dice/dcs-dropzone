import { getLogger } from "log4js";
import type { RootFilterQuery } from "mongoose";
import { z } from "zod";
import type { ModCategory } from "../../../common/data.ts";
import { ModVisibility } from "../../../common/data.ts";
import { ModSummary } from "../entities/ModSummary.ts";
import { ModAvailableFilterData } from "../schemas/ModAvailableFilterData.ts";
import { ModData } from "../schemas/ModData.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import { PageData } from "../schemas/PageData.ts";

const logger = getLogger("queries/find-published-mods");

const InputSchema = z.object({
	page: z.number(),
	size: z.number(),
	filter: z
		.object({
			category: ModData.shape.category.optional(),
			maintainers: z.array(z.string()).optional(),
			tags: z.array(z.string()).optional(),
			term: z.string().optional(),
		})
		.optional(),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	orm: typeof ModSummary;
}

export default async function (
	input: Input,
	deps: Deps,
): Promise<{
	data: ModSummaryData[];
	page: PageData;
	filter: ModAvailableFilterData;
}> {
	const filter = input.filter || {};
	const filterQ: RootFilterQuery<typeof ModSummary> = {
		visibility: ModVisibility.PUBLIC,
	};

	if (filter.category) {
		logger.debug(
			{ filterCategory: filter.category },
			"Applying category filter",
		);
		filterQ.category = filter.category;
	}

	if (filter.maintainers && filter.maintainers.length > 0) {
		logger.debug(
			{ filterMaintainers: filter.maintainers },
			"Applying maintainers filter",
		);
		filterQ.maintainers = { $in: filter.maintainers };
	}

	if (filter.tags && filter.tags.length > 0) {
		logger.debug({ filterTags: filter.tags }, "Applying tags filter");
		filterQ.tags = { $all: filter.tags };
	}

	if (filter.term) {
		logger.debug({ filterTerm: filter.term }, "Applying term filter");
		filterQ.name = { $regex: filter.term, $options: "i" };
	}

	logger.debug("Finding all published mods");
	const count = await deps.orm.countDocuments(filterQ);

	const docs = await deps.orm
		.find(filterQ)
		.skip((input.page - 1) * input.size)
		.sort({ createdAt: -1 })
		.limit(input.size)
		.lean()
		.exec();

	const categories = await deps.orm.distinct("category", filterQ).exec();
	const tags = await deps.orm.distinct("tags", filterQ).exec();
	const maintainers = await deps.orm
		.aggregate([
			{ $match: filterQ },
			{ $unwind: "$maintainers" },
			{
				$group: {
					_id: "$maintainers",
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "_id",
					foreignField: "id",
					as: "userDetails",
				},
			},
			{ $unwind: "$userDetails" },
			{
				$project: {
					id: "$userDetails.id",
					username: "$userDetails.username",
				},
			},
		])
		.exec();

	return {
		data: ModSummaryData.array().parse(docs),
		page: PageData.parse({
			number: input.page,
			size: input.size,
			totalPages: Math.ceil(count / input.size) || 1,
			totalElements: count,
		}),
		filter: ModAvailableFilterData.parse({
			categories,
			maintainers,
			tags,
		}),
	};
}

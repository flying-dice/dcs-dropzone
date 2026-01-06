import { getLogger } from "log4js";
import type { QueryFilter } from "mongoose";
import type { ModCategory } from "../enums/ModCategory.ts";
import { ModVisibility } from "../enums/ModVisibility.ts";
import { ModSummary } from "../mongo-db/entities/ModSummary.ts";
import { ModAvailableFilterData } from "../schemas/ModAvailableFilterData.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import { PageData } from "../schemas/PageData.ts";

const logger = getLogger("GetAllPublishedMods");

type GetAllPublishedModsQuery = {
	page: number;
	size: number;
	filter?: {
		category?: ModCategory;
		maintainers?: string[];
		tags?: string[];
		term?: string;
	};
};
type GetAllPublishedModsResult = {
	data: ModSummaryData[];
	page: PageData;
	filter: ModAvailableFilterData;
};

export default async function (query: GetAllPublishedModsQuery): Promise<GetAllPublishedModsResult> {
	const { page, size, filter = {} } = query;

	const filterQ: QueryFilter<ModSummary> = {
		visibility: ModVisibility.PUBLIC,
	};

	if (filter.category) {
		logger.debug({ filterCategory: filter.category }, "Applying category filter");
		filterQ.category = filter.category;
	}

	if (filter.maintainers && filter.maintainers.length > 0) {
		logger.debug({ filterMaintainers: filter.maintainers }, "Applying maintainers filter");
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
	const count = await ModSummary.countDocuments(filterQ);

	const docs = await ModSummary.find(filterQ)
		.skip((page - 1) * size)
		.sort({ createdAt: -1 })
		.limit(size)
		.lean()
		.exec();

	const categories = await ModSummary.distinct("category", filterQ).exec();
	const tags = await ModSummary.distinct("tags", filterQ).exec();
	const maintainers = await ModSummary.aggregate([
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
	]).exec();

	return {
		data: ModSummaryData.array().parse(docs),
		page: PageData.parse({
			number: page,
			size: size,
			totalPages: Math.ceil(count / size) || 1,
			totalElements: count,
		}),
		filter: ModAvailableFilterData.parse({
			categories,
			maintainers,
			tags,
		}),
	};
}

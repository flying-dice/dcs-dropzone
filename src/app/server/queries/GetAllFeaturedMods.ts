import { ModVisibility } from "../../../common/data.ts";
import { ModSummary } from "../entities/ModSummary.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";

type GetAllFeaturedModsResult = ModSummaryData[];

export default async function (): Promise<GetAllFeaturedModsResult> {
	const docs = await ModSummary.find({
		visibility: ModVisibility.PUBLIC,
		featuredAt: { $ne: null },
	})
		.sort({ featuredAt: -1 })
		.limit(4)
		.lean()
		.exec();

	return ModSummaryData.array().parse(docs);
}

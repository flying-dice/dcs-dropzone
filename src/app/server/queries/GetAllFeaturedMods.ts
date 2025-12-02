import { ModVisibility } from "../../../common/data.ts";
import { ModSummary } from "../entities/ModSummary.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";

export async function getAllFeaturedMods(): Promise<ModSummaryData[]> {
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

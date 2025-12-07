import { ModSummary } from "../entities/ModSummary.ts";
import { ModVisibility } from "../enums/ModVisibility.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";

type GetAllPopularModsResult = ModSummaryData[];

export default async function (): Promise<GetAllPopularModsResult> {
	const docs = await ModSummary.find({
		visibility: ModVisibility.PUBLIC,
	})
		.sort({ downloadsCount: "desc" })
		.limit(10)
		.lean()
		.exec();

	return ModSummaryData.array().parse(docs);
}

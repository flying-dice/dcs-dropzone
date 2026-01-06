import { ModVisibility } from "../enums/ModVisibility.ts";
import { ModSummary } from "../mongo-db/entities/ModSummary.ts";
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

import { ModVisibility } from "../application/enums/ModVisibility.ts";
import { ModSummaryData } from "../application/schemas/ModSummaryData.ts";
import { ModSummary } from "../infrastructure/mongo-db/entities/ModSummary.ts";

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

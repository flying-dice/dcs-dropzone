import { z } from "zod";
import { ModVisibility } from "../../../common/data.ts";
import { ModSummary } from "../entities/ModSummary.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";

const InputSchema = z.object({});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	orm: typeof ModSummary;
}

export default async function (
	input: Input,
	deps: Deps,
): Promise<ModSummaryData[]> {
	const docs = await deps.orm
		.find({
			visibility: ModVisibility.PUBLIC,
			featuredAt: { $ne: null },
		})
		.sort({ featuredAt: -1 })
		.limit(4)
		.lean()
		.exec();

	return ModSummaryData.array().parse(docs);
}

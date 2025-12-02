import { getLogger } from "log4js";
import type { RootFilterQuery } from "mongoose";
import { z } from "zod";
import { ModSummary } from "../entities/ModSummary.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";

const logger = getLogger("queries/find-all-by-ids");

const InputSchema = z.object({
	ids: z.array(z.string()),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	orm: typeof ModSummary;
}

export default async function (
	input: Input,
	deps: Deps,
): Promise<ModSummaryData[]> {
	const filterQ: RootFilterQuery<typeof ModSummary> = {
		id: { $in: input.ids },
	};

	logger.debug("Finding all mods by ids");

	const docs = await deps.orm.find(filterQ).lean().exec();

	return ModSummaryData.array().parse(docs);
}

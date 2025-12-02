import { getLogger } from "log4js";
import { z } from "zod";
import { ModSummary } from "../entities/ModSummary.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";

const logger = getLogger("queries/find-mod-by-id");

const InputSchema = z.object({
	id: z.string(),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	orm: typeof ModSummary;
}

export default async function (
	input: Input,
	deps: Deps,
): Promise<ModSummaryData | null> {
	logger.debug({ id: input.id }, "Finding mod by id");

	const doc = await deps.orm.findOne({ id: input.id }).lean().exec();

	if (!doc) {
		return null;
	}

	return ModSummaryData.parse(doc);
}

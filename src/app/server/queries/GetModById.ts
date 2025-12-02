import { getLogger } from "log4js";
import { ModSummary } from "../entities/ModSummary.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";

const logger = getLogger("GetById");

export async function getModById(id: string): Promise<ModSummaryData | null> {
	logger.debug({ id }, "Finding mod by id");

	const doc = await ModSummary.findOne({ id }).lean().exec();

	if (!doc) {
		return null;
	}

	return ModSummaryData.parse(doc);
}

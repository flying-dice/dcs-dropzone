import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { ModSummary } from "../entities/ModSummary.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";

const logger = getLogger("GetById");

export type GetModByIdResult = Result<ModSummaryData, "ModNotFound">;

export default async function (id: string): Promise<GetModByIdResult> {
	logger.debug({ id }, "Finding mod by id");

	const doc = await ModSummary.findOne({ id }).lean().exec();

	if (!doc) {
		return err("ModNotFound");
	}

	return ok(ModSummaryData.parse(doc));
}

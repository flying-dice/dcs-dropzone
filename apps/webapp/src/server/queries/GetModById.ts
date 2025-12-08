import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { Mod } from "../entities/Mod.ts";
import { ModData } from "../schemas/ModData.ts";

const logger = getLogger("GetById");

export type GetModByIdResult = Result<ModData, "ModNotFound">;

export default async function (id: string): Promise<GetModByIdResult> {
	logger.debug({ id }, "Finding mod by id");

	const doc = await Mod.findOne({ id }).lean().exec();

	if (!doc) {
		return err("ModNotFound");
	}

	return ok(ModData.parse(doc));
}

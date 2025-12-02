import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { Mod } from "../entities/Mod.ts";
import { ModData } from "../schemas/ModData.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("FindUserModByIdQuery");

export type FindUserModByIdQuery = {
	user: UserData;
	modId: string;
};

export default async function ({ user, modId }: FindUserModByIdQuery): Promise<Result<ModData, "NotFound">> {
	logger.debug({ userId: user.id, modId }, "findUserModById start");
	const mod = await Mod.findOne({ id: modId, maintainers: user.id }).lean().exec();

	if (!mod) {
		logger.debug({ modId }, "User attempted to fetch mod but it was not found");
		return err("NotFound");
	}

	logger.debug({ modId }, "User successfully fetched mod");

	return ok(ModData.parse(mod));
}

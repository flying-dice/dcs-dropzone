import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { Mod } from "../entities/Mod.ts";
import { ModData } from "../schemas/ModData.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("FindUserModById");

export type FindUserModByIdProps = {
	user: UserData;
	modId: string;
};

export async function findUserModById(
	props: FindUserModByIdProps,
): Promise<Result<ModData, "NotFound">> {
	const { modId } = props;
	logger.debug({ userId: props.user.id, modId }, "findUserModById start");
	const mod = await Mod.findOne({ id: modId, maintainers: props.user.id })
		.lean()
		.exec();

	if (!mod) {
		logger.debug({ modId }, "User attempted to fetch mod but it was not found");
		return err("NotFound");
	}

	logger.debug({ modId }, "User successfully fetched mod");

	return ok(ModData.parse(mod));
}

import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { Mod } from "../entities/Mod.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("DeleteModCommand");

export type DeleteModCommand = {
	user: UserData;
	id: string;
};
export default async function ({ user, id }: DeleteModCommand): Promise<Result<undefined, "NotFound">> {
	logger.debug({ userId: user.id, modId: id }, "deleteMod start");

	const result = await Mod.findOneAndDelete({
		id,
		maintainers: user.id,
	}).exec();

	if (!result) {
		logger.warn({ modId: id }, "User attempted to delete mod but it was not found");
		return err("NotFound");
	}

	logger.debug({ modId: id }, "User successfully deleted mod");
	return ok(undefined);
}

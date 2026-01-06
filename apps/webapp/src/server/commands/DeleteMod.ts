import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { Mod } from "../infrastructure/mongo-db/entities/Mod.ts";
import type { UserData } from "../application/schemas/UserData.ts";

const logger = getLogger("DeleteModCommand");

export type DeleteModCommand = {
	user: UserData;
	id: string;
};

export type DeleteModResult = Result<undefined, "ModNotFound">;

export default async function (command: DeleteModCommand): Promise<DeleteModResult> {
	const { user, id } = command;
	logger.debug({ userId: user.id, modId: id }, "deleteMod start");

	const result = await Mod.findOneAndDelete({
		id,
		maintainers: user.id,
	}).exec();

	if (!result) {
		logger.warn({ modId: id }, "User attempted to delete mod but it was not found");
		return err("ModNotFound");
	}

	logger.debug({ modId: id }, "User successfully deleted mod");
	return ok(undefined);
}

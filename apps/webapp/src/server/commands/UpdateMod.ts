import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { Mod } from "../entities/Mod.ts";
import type { ModUpdateData } from "../schemas/ModUpdateData.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("UpdateModCommand");

export type UpdateModCommand = {
	user: UserData;
	updateData: ModUpdateData;
	modId: string;
};

export type UpdateModResult = Result<undefined, "ModNotFound">;

export default async function (command: UpdateModCommand): Promise<UpdateModResult> {
	const { user, updateData, modId } = command;
	logger.debug({ userId: user.id, modId }, "updateMod start");

	const mod = await Mod.findOneAndUpdate({ id: modId, maintainers: user.id }, updateData).exec();

	if (!mod) {
		logger.warn({ modId }, "User attempted to save mod but it was not found");
		return err("ModNotFound");
	}

	logger.debug({ modId }, "User successfully updated mod");
	return ok(undefined);
}

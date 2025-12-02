import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("DeleteReleaseCommand");

export type DeleteReleaseCommand = {
	modId: string;
	releaseId: string;
	user: UserData;
};

export type DeleteReleaseResult = Result<undefined, "ModNotFound" | "ReleaseNotFound">;

export default async function (command: DeleteReleaseCommand): Promise<DeleteReleaseResult> {
	const { modId, releaseId, user } = command;
	logger.debug({ userId: user.id, modId, releaseId }, "deleteRelease start");

	if (!(await Mod.exists({ id: modId, maintainers: user.id }))) {
		logger.warn({ modId, userId: user.id }, "User attempted to delete release for a mod they do not maintain");
		return err("ModNotFound");
	}

	const result = await ModRelease.findOneAndDelete({
		id: releaseId,
		mod_id: modId,
	}).exec();

	if (!result) {
		logger.warn({ releaseId }, "User attempted to delete release but it was not found");
		return err("ReleaseNotFound");
	}

	logger.debug({ releaseId }, "User successfully deleted release");
	return ok(undefined);
}

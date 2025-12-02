import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { ModRelease } from "../entities/ModRelease.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("DeleteReleaseCommand");

export type DeleteReleaseCommand = {
	modId: string;
	releaseId: string;
	user: UserData;
};
export default async function ({
	modId,
	releaseId,
	user,
}: DeleteReleaseCommand): Promise<Result<undefined, "NotFound">> {
	logger.debug({ userId: user.id, modId, releaseId }, "deleteRelease start");

	const result = await ModRelease.findOneAndDelete({
		id: releaseId,
		mod_id: modId,
	}).exec();

	if (!result) {
		logger.warn(
			{ releaseId },
			"User attempted to delete release but it was not found",
		);
		return err("NotFound");
	}

	logger.debug({ releaseId }, "User successfully deleted release");
	return ok(undefined);
}

import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { ModRelease } from "../entities/ModRelease.ts";
import type { ModReleaseData } from "../schemas/ModReleaseData.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("UpdateReleaseCommand");

export type UpdateReleaseCommand = {
	updateData: ModReleaseData;
	user: UserData;
};
export default async function ({ updateData, user }: UpdateReleaseCommand): Promise<Result<undefined, "NotFound">> {
	logger.debug({ userId: user.id, updateData }, "updateRelease start");

	const release = await ModRelease.findOneAndUpdate(
		{ id: updateData.id, mod_id: updateData.mod_id },
		{
			version: updateData.version,
			changelog: updateData.changelog,
			assets: updateData.assets,
			symbolicLinks: updateData.symbolicLinks,
			visibility: updateData.visibility,
		},
	).exec();

	if (!release) {
		logger.warn({ releaseId: updateData.id }, "User attempted to update release but it was not found");
		return err("NotFound");
	}

	logger.debug({ releaseId: updateData.id }, "User successfully updated release");
	return ok(undefined);
}

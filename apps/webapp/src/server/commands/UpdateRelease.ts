import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import objectHash from "object-hash";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import type { ModReleaseData } from "../schemas/ModReleaseData.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("UpdateReleaseCommand");

export type UpdateReleaseCommand = {
	updateData: Omit<ModReleaseData, "versionHash">;
	user: UserData;
};

export type UpdateReleaseResult = Result<undefined, "ModNotFound" | "ReleaseNotFound">;

export default async function (command: UpdateReleaseCommand): Promise<UpdateReleaseResult> {
	const { updateData, user } = command;
	logger.debug({ userId: user.id, updateData }, "updateRelease start");

	if (!(await Mod.exists({ id: updateData.mod_id, maintainers: user.id }))) {
		logger.warn(
			{ userId: user.id, modId: updateData.mod_id },
			"User attempted to update release for a mod they do not own",
		);
		return err("ModNotFound");
	}

	const release = await ModRelease.findOneAndUpdate(
		{ id: updateData.id, mod_id: updateData.mod_id },
		{
			version: updateData.version,
			versionHash: objectHash(Date.now()),
			changelog: updateData.changelog,
			assets: updateData.assets,
			symbolicLinks: updateData.symbolicLinks,
			visibility: updateData.visibility,
			missionScripts: updateData.missionScripts,
		},
	).exec();

	if (!release) {
		logger.warn({ releaseId: updateData.id }, "User attempted to update release but it was not found");
		return err("ReleaseNotFound");
	}

	logger.debug({ releaseId: updateData.id }, "User successfully updated release");
	return ok(undefined);
}

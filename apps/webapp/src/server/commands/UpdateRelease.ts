import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import objectHash from "object-hash";
import { Mod } from "../infrastructure/mongo-db/entities/Mod.ts";
import { ModRelease } from "../infrastructure/mongo-db/entities/ModRelease.ts";
import type { ModReleaseData } from "../application/schemas/ModReleaseData.ts";
import type { UserData } from "../application/schemas/UserData.ts";

const logger = getLogger("UpdateReleaseCommand");

export type UpdateReleaseCommand = {
	updateData: Omit<ModReleaseData, "versionHash">;
	user: UserData;
};

export type UpdateReleaseResult = Result<undefined, "ModNotFound" | "ReleaseNotFound">;

export default async function (command: UpdateReleaseCommand): Promise<UpdateReleaseResult> {
	const { updateData, user } = command;
	logger.debug({ userId: user.id, updateData }, "updateRelease start");

	if (!(await Mod.exists({ id: updateData.modId, maintainers: user.id }))) {
		logger.warn(
			{ userId: user.id, modId: updateData.modId },
			"User attempted to save release for a mod they do not own",
		);
		return err("ModNotFound");
	}

	const release = await ModRelease.findOneAndUpdate(
		{ id: updateData.id, modId: updateData.modId },
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
		logger.warn({ releaseId: updateData.id }, "User attempted to save release but it was not found");
		return err("ReleaseNotFound");
	}

	logger.debug({ releaseId: updateData.id }, "User successfully updated release");
	return ok(undefined);
}

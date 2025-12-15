import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("MarkReleaseAsLatestCommand");

export type MarkReleaseAsLatestCommand = {
	user: UserData;
	modId: string;
	releaseId: string;
};

export type MarkReleaseAsLatestResult = Result<undefined, "ModNotFound" | "ReleaseNotFound">;

export default async function (command: MarkReleaseAsLatestCommand): Promise<MarkReleaseAsLatestResult> {
	const { user, modId, releaseId } = command;
	logger.debug({ userId: user.id, modId, releaseId }, "markReleaseAsLatest start");

	// Verify the user owns the mod
	if (!(await Mod.exists({ id: modId, maintainers: user.id }))) {
		logger.warn({ userId: user.id, modId }, "User attempted to mark release as latest for a mod they do not own");
		return err("ModNotFound");
	}

	// Verify the release exists
	const release = await ModRelease.findOne({ id: releaseId, mod_id: modId }).exec();
	if (!release) {
		logger.warn({ releaseId, modId }, "Release not found");
		return err("ReleaseNotFound");
	}

	// Unmark all other releases for this mod
	await ModRelease.updateMany({ mod_id: modId, id: { $ne: releaseId } }, { isLatest: false }).exec();

	// Mark the specified release as latest
	await ModRelease.updateOne({ id: releaseId, mod_id: modId }, { isLatest: true }).exec();

	logger.debug({ releaseId, modId }, "Successfully marked release as latest");
	return ok(undefined);
}

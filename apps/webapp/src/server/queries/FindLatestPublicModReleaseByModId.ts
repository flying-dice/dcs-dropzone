import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModVisibility } from "../enums/ModVisibility.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";

const logger = getLogger("FindLatestPublicModReleaseByModIdQuery");

export type FindLatestPublicModReleaseByModIdQuery = {
	modId: string;
};

export type FindLatestPublicModReleaseByModIdResult = Result<ModReleaseData, "ModNotFound" | "ReleaseNotFound">;

export default async function (
	query: FindLatestPublicModReleaseByModIdQuery,
): Promise<FindLatestPublicModReleaseByModIdResult> {
	const { modId } = query;

	logger.debug({ modId }, "start");

	const mod = await Mod.findOne({ id: modId, visibility: ModVisibility.PUBLIC }).exec();
	if (!mod) {
		logger.debug({ modId }, "Public mod not found");
		return err("ModNotFound");
	}

	// Only use the release marked as latest on the mod
	if (!mod.latestReleaseId) {
		logger.debug({ modId }, "No latest release set on mod");
		return err("ReleaseNotFound");
	}

	const release = await ModRelease.findOne({
		id: mod.latestReleaseId,
		mod_id: modId,
		visibility: ModVisibility.PUBLIC,
	})
		.lean()
		.exec();

	if (!release) {
		logger.debug({ modId, latestReleaseId: mod.latestReleaseId }, "Latest release not found");
		return err("ReleaseNotFound");
	}

	return ok(ModReleaseData.parse(release));
}

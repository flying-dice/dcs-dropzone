import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModVisibility } from "../enums/ModVisibility.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";

const logger = getLogger("FindLatestPublicModReleaseByModIdQuery");

export enum FindLatestPublicModReleaseByModIdError {
	ModNotFound = "ModNotFound",
	ReleaseNotFound = "ReleaseNotFound",
}

export type FindLatestPublicModReleaseByModIdQuery = {
	modId: string;
};

export type FindLatestPublicModReleaseByModIdResult = Result<ModReleaseData, FindLatestPublicModReleaseByModIdError>;

export default async function (
	query: FindLatestPublicModReleaseByModIdQuery,
): Promise<FindLatestPublicModReleaseByModIdResult> {
	const { modId } = query;

	logger.debug({ modId }, "start");

	const mod = await Mod.findOne({
		id: modId,
		visibility: { $in: [ModVisibility.PUBLIC, ModVisibility.UNLISTED] },
	}).exec();
	if (!mod) {
		logger.debug({ modId }, "Public mod not found");
		return err(FindLatestPublicModReleaseByModIdError.ModNotFound);
	}

	// Only use the release marked as latest on the mod
	if (!mod.latestReleaseId) {
		logger.debug({ modId }, "No latest release set on mod");
		return err(FindLatestPublicModReleaseByModIdError.ReleaseNotFound);
	}

	const release = await ModRelease.findOne({
		id: mod.latestReleaseId,
		mod_id: modId,
		visibility: { $in: [ModVisibility.PUBLIC, ModVisibility.UNLISTED] },
	})
		.lean()
		.exec();

	if (!release) {
		logger.debug({ modId, latestReleaseId: mod.latestReleaseId }, "Latest release not found");
		return err(FindLatestPublicModReleaseByModIdError.ReleaseNotFound);
	}

	return ok(ModReleaseData.parse(release));
}

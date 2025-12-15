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

	// First try to find the release specified as latest in the mod
	let release = null;
	if (mod.latestReleaseId) {
		release = await ModRelease.findOne({
			id: mod.latestReleaseId,
			mod_id: modId,
			visibility: ModVisibility.PUBLIC,
		})
			.lean()
			.exec();
	}

	// If no release is marked as latest in mod, fall back to the most recent release
	if (!release) {
		release = await ModRelease.findOne({
			mod_id: modId,
			visibility: ModVisibility.PUBLIC,
		})
			.sort({ createdAt: "desc" })
			.limit(1)
			.lean()
			.exec();
	}

	if (!release) {
		logger.debug({ modId }, "Latest release not found");
		return err("ReleaseNotFound");
	}

	return ok(ModReleaseData.parse(release));
}

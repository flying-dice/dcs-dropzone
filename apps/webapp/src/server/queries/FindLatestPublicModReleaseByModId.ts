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

	if (!(await Mod.exists({ id: modId, visibility: ModVisibility.PUBLIC }).exec())) {
		logger.debug({ modId }, "Public mod not found");
		return err("ModNotFound");
	}

	const release = await ModRelease.findOne({
		mod_id: modId,
		visibility: ModVisibility.PUBLIC,
	})
		.sort({ createdAt: "desc" })
		.limit(1)
		.lean()
		.exec();

	if (!release) {
		logger.debug({ modId }, "Latest release not found");
		return err("ReleaseNotFound");
	}

	return ok(ModReleaseData.parse(release));
}

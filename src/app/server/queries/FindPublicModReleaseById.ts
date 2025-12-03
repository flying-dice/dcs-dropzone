import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { ModVisibility } from "../../../common/data.ts";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";

const logger = getLogger("FindPublicModReleaseByIdQuery");

export type FindPublicModReleaseByIdQuery = {
	modId: string;
	releaseId: string;
};

export type FindPublicModReleaseByIdResult = Result<ModReleaseData, "ModNotFound" | "ReleaseNotFound">;

export default async function (query: FindPublicModReleaseByIdQuery): Promise<FindPublicModReleaseByIdResult> {
	const { modId, releaseId } = query;

	logger.debug({ modId, releaseId }, "start");

	if (!(await Mod.exists({ id: modId, visibility: ModVisibility.PUBLIC }).exec())) {
		logger.debug({ modId }, "Public mod not found");
		return err("ModNotFound");
	}

	const release = await ModRelease.findOne({
		id: releaseId,
		mod_id: modId,
		visibility: ModVisibility.PUBLIC,
	})
		.lean()
		.exec();

	if (!release) {
		logger.debug({ releaseId }, "Public release not found");
		return err("ReleaseNotFound");
	}

	return ok(ModReleaseData.parse(release));
}

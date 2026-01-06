import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { Mod } from "../infrastructure/mongo-db/entities/Mod.ts";
import { ModRelease } from "../infrastructure/mongo-db/entities/ModRelease.ts";
import { ModVisibility } from "../application/enums/ModVisibility.ts";
import { ModReleaseData } from "../application/schemas/ModReleaseData.ts";

const logger = getLogger("FindPublicModReleaseByIdQuery");

export type FindPublicModReleaseByIdQuery = {
	modId: string;
	releaseId: string;
};

export type FindPublicModReleaseByIdResult = Result<ModReleaseData, "ModNotFound" | "ReleaseNotFound">;

export default async function (query: FindPublicModReleaseByIdQuery): Promise<FindPublicModReleaseByIdResult> {
	const { modId, releaseId } = query;

	logger.debug({ modId, releaseId }, "start");

	if (!(await Mod.exists({ id: modId, visibility: { $in: [ModVisibility.PUBLIC, ModVisibility.UNLISTED] } }).exec())) {
		logger.debug({ modId }, "Public mod not found");
		return err("ModNotFound");
	}

	const release = await ModRelease.findOne({
		id: releaseId,
		modId,
		visibility: { $in: [ModVisibility.PUBLIC, ModVisibility.UNLISTED] },
	})
		.lean()
		.exec();

	if (!release) {
		logger.debug({ releaseId }, "Public release not found");
		return err("ReleaseNotFound");
	}

	return ok(ModReleaseData.parse(release));
}

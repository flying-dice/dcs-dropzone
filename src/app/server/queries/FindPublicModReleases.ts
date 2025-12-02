import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { ModVisibility } from "../../../common/data.ts";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";

const logger = getLogger("FindPublicModReleasesQuery");

export type FindPublicModReleasesQuery = {
	modId: string;
};

export async function findPublicModReleases({
	modId,
}: FindPublicModReleasesQuery): Promise<Result<ModReleaseData[], "NotFound">> {
	logger.debug({ modId }, "findPublicModReleases start");

	const mod = await Mod.findOne({ id: modId }).lean().exec();

	if (!mod) {
		logger.debug({ modId }, "Mod not found");
		return err("NotFound");
	}

	const releases = await ModRelease.find({
		mod_id: modId,
		visibility: ModVisibility.PUBLIC,
	})
		.sort({ createdAt: -1 })
		.lean()
		.exec();

	return ok(ModReleaseData.array().parse(releases));
}

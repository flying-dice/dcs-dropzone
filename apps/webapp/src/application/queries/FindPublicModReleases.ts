import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { ModVisibility } from "../enums/ModVisibility.ts";
import { Mod } from "../mongo-db/entities/Mod.ts";
import { ModRelease } from "../mongo-db/entities/ModRelease.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";

const logger = getLogger("FindPublicModReleasesQuery");

export type FindPublicModReleasesQuery = {
	modId: string;
};

export type FindPublicModReleasesResult = Result<ModReleaseData[], "NotFound">;

export default async function (query: FindPublicModReleasesQuery): Promise<FindPublicModReleasesResult> {
	const { modId } = query;

	logger.debug({ modId }, "findPublicModReleases start");

	const mod = await Mod.findOne({ id: modId }).lean().exec();

	if (!mod) {
		logger.debug({ modId }, "Mod not found");
		return err("NotFound");
	}

	const releases = await ModRelease.find({
		modId,
		visibility: ModVisibility.PUBLIC,
	})
		.sort({ createdAt: -1 })
		.lean()
		.exec();

	return ok(ModReleaseData.array().parse(releases));
}

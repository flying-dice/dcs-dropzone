import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("FindUserModReleases");

export type FindUserModReleasesQuery = {
	modId: string;
	user: UserData;
};
export type FindUserModReleasesResult = Result<ModReleaseData[], "NotFound">;

export default async function (query: FindUserModReleasesQuery): Promise<FindUserModReleasesResult> {
	const { modId, user } = query;

	logger.debug({ userId: user.id, modId }, "findUserModReleases start");

	const mod = await Mod.findOne({ id: modId, maintainers: user.id }).lean().exec();
	if (!mod) {
		logger.warn({ userId: user.id, modId }, "User attempted to access releases for a mod they do not own");
		return err("NotFound");
	}

	const releases = await ModRelease.find({ modId }).sort({ createdAt: -1 }).lean().exec();

	return ok(ModReleaseData.array().parse(releases));
}

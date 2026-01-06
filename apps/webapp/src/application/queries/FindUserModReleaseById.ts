import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { ModRelease } from "../mongo-db/entities/ModRelease.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("FindUserModReleaseById");

export type FindUserModReleaseByIdQuery = {
	user: UserData;
	modId: string;
	releaseId: string;
};

export type FindUserModReleaseByIdResult = Result<ModReleaseData, "NotFound">;

export default async function (query: FindUserModReleaseByIdQuery): Promise<FindUserModReleaseByIdResult> {
	const { modId, releaseId, user } = query;

	logger.debug({ userId: user.id, modId, releaseId }, "findUserModReleaseById start");

	const release = await ModRelease.findOne({
		id: releaseId,
		modId,
	})
		.lean()
		.exec();

	if (!release) {
		logger.debug({ releaseId }, "Release not found");
		return err("NotFound");
	}

	return ok(ModReleaseData.parse(release));
}

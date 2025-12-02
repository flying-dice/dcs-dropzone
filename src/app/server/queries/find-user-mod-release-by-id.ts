import { getLogger } from "log4js";
import { z } from "zod";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";

const logger = getLogger("queries/find-user-mod-release-by-id");

const InputSchema = z.object({
	userId: z.string(),
	modId: z.string(),
	releaseId: z.string(),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	orm: typeof ModRelease;
}

export default async function (
	input: Input,
	deps: Deps,
): Promise<ModReleaseData | null> {
	logger.debug(
		{ userId: input.userId, modId: input.modId, releaseId: input.releaseId },
		"findUserModReleaseById start",
	);

	const release = await deps.orm
		.findOne({
			id: input.releaseId,
			mod_id: input.modId,
		})
		.lean()
		.exec();

	if (!release) {
		logger.debug({ releaseId: input.releaseId }, "Release not found");
		return null;
	}

	return ModReleaseData.parse(release);
}

import { getLogger } from "log4js";
import { z } from "zod";
import { ModVisibility } from "../../../common/data.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";

const logger = getLogger("queries/find-public-mod-release-by-id");

const InputSchema = z.object({
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
		{ modId: input.modId, releaseId: input.releaseId },
		"findPublicModReleaseById start",
	);

	const release = await deps.orm
		.findOne({
			id: input.releaseId,
			mod_id: input.modId,
			visibility: ModVisibility.PUBLIC,
		})
		.lean()
		.exec();

	if (!release) {
		logger.debug({ releaseId: input.releaseId }, "Public release not found");
		return null;
	}

	return ModReleaseData.parse(release);
}

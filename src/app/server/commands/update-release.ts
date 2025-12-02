import { getLogger } from "log4js";
import { z } from "zod";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";

const logger = getLogger("commands/update-release");

const InputSchema = z.object({
	userId: z.string(),
	data: ModReleaseData,
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {}

export default async function (
	input: Input,
	deps: Deps,
): Promise<boolean> {
	logger.debug({ userId: input.userId, updateData: input.data }, "updateRelease start");

	const release = await ModRelease.findOneAndUpdate(
		{ id: input.data.id, mod_id: input.data.mod_id },
		{
			version: input.data.version,
			changelog: input.data.changelog,
			assets: input.data.assets,
			symbolicLinks: input.data.symbolicLinks,
			visibility: input.data.visibility,
		},
	).exec();

	if (!release) {
		logger.warn(
			{ releaseId: input.data.id },
			"User attempted to update release but it was not found",
		);
		return false;
	}

	logger.debug(
		{ releaseId: input.data.id },
		"User successfully updated release",
	);
	return true;
}

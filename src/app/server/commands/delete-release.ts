import { getLogger } from "log4js";
import { z } from "zod";
import { ModRelease } from "../entities/ModRelease.ts";

const logger = getLogger("commands/delete-release");

const InputSchema = z.object({
	userId: z.string(),
	modId: z.string(),
	releaseId: z.string(),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {}

export default async function (
	input: Input,
	deps: Deps,
): Promise<boolean> {
	logger.debug(
		{ userId: input.userId, modId: input.modId, releaseId: input.releaseId },
		"deleteRelease start",
	);

	const result = await ModRelease.findOneAndDelete({
		id: input.releaseId,
		mod_id: input.modId,
	}).exec();

	if (!result) {
		logger.warn(
			{ releaseId: input.releaseId },
			"User attempted to delete release but it was not found",
		);
		return false;
	}

	logger.debug({ releaseId: input.releaseId }, "User successfully deleted release");
	return true;
}

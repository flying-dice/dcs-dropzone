import { getLogger } from "log4js";
import { z } from "zod";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";

const logger = getLogger("queries/find-user-mod-releases");

const InputSchema = z.object({
	userId: z.string(),
	modId: z.string(),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {}

export default async function (
	input: Input,
	deps: Deps,
): Promise<ModReleaseData[]> {
	logger.debug(
		{ userId: input.userId, modId: input.modId },
		"findUserModReleases start",
	);

	const releases = await ModRelease.find({ mod_id: input.modId })
		.sort({ createdAt: -1 })
		.lean()
		.exec();

	return ModReleaseData.array().parse(releases);
}

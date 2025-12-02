import { getLogger } from "log4js";
import { z } from "zod";
import { ModVisibility } from "../../../common/data.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModReleaseData } from "../schemas/ModReleaseData.ts";

const logger = getLogger("queries/find-public-mod-releases");

const InputSchema = z.object({
	modId: z.string(),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {}

export default async function (
	input: Input,
	deps: Deps,
): Promise<ModReleaseData[]> {
	logger.debug({ modId: input.modId }, "findPublicModReleases start");

	const releases = await ModRelease.find({
		mod_id: input.modId,
		visibility: ModVisibility.PUBLIC,
	})
		.sort({ createdAt: -1 })
		.lean()
		.exec();

	return ModReleaseData.array().parse(releases);
}

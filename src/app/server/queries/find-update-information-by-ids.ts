import { getLogger } from "log4js";
import { z } from "zod";
import { ModVisibility } from "../../../common/data.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import type { ModLatestReleaseData } from "../schemas/ModLatestReleaseData.ts";

const logger = getLogger("queries/find-update-information-by-ids");

const InputSchema = z.object({
	modIds: z.array(z.string()),
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {}

export default async function (
	input: Input,
	deps: Deps,
): Promise<ModLatestReleaseData[]> {
	logger.debug({ modIds: input.modIds }, "findUpdateInformationByIds start");

	const modsAndLatestReleases: Array<ModLatestReleaseData> = [];

	for (const modId of input.modIds) {
		const latestRelease = await ModRelease.findOne({
			mod_id: modId,
			visibility: ModVisibility.PUBLIC,
		})
			.sort({ createdAt: -1 })
			.lean()
			.exec();

		if (latestRelease) {
			modsAndLatestReleases.push({
				mod_id: modId,
				id: latestRelease.id,
				version: latestRelease.version,
				createdAt: latestRelease.createdAt.toString(),
			});
		}
	}

	return modsAndLatestReleases;
}

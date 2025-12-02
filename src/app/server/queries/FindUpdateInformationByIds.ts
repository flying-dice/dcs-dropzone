import { getLogger } from "log4js";
import { ModVisibility } from "../../../common/data.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import type { ModLatestReleaseData } from "../schemas/ModLatestReleaseData.ts";

const logger = getLogger("FindUpdateInformationByIds");

export type FindUpdateInformationByIds = {
	modIds: string[];
};

export async function findUpdateInformationByIds({
	modIds,
}: FindUpdateInformationByIds): Promise<ModLatestReleaseData[]> {
	logger.debug({ modIds }, "start");

	const modsAndLatestReleases: Array<ModLatestReleaseData> = [];

	for (const modId of modIds) {
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

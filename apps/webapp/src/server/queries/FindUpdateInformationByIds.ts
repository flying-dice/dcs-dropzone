import { getLogger } from "log4js";
import { ModRelease } from "../entities/ModRelease.ts";
import { ModVisibility } from "../enums/ModVisibility.ts";
import type { ModLatestReleaseData } from "../schemas/ModLatestReleaseData.ts";

const logger = getLogger("FindUpdateInformationByIdsQuery");

export type FindUpdateInformationByIdsQuery = {
	modIds: string[];
};

export type FindUpdateInformationByIdsResult = ModLatestReleaseData[];

export default async function (query: FindUpdateInformationByIdsQuery): Promise<FindUpdateInformationByIdsResult> {
	const { modIds } = query;
	logger.debug({ modIds }, "start");

	const modsAndLatestReleases: Array<ModLatestReleaseData> = [];

	for (const modId of modIds) {
		const latestRelease = await ModRelease.findOne({
			modId: modId,
			visibility: ModVisibility.PUBLIC,
		})
			.sort({ createdAt: -1 })
			.lean()
			.exec();

		if (latestRelease) {
			modsAndLatestReleases.push({
				modId: modId,
				id: latestRelease.id,
				version: latestRelease.version,
				createdAt: latestRelease.createdAt.toString(),
			});
		}
	}

	return modsAndLatestReleases;
}

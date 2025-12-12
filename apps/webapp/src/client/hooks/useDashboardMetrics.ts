import { StatusCodes } from "http-status-codes";
import { useAsync } from "react-use";
import { useGetCountTotalPublicMods } from "../_autogen/api.ts";
import { ModAndReleaseDataStatus, useGetAllDaemonReleases } from "../_autogen/daemon_api.ts";
import { memoizedGetLatestModReleaseById } from "../utils/MemoizedGetLatestModReleaseById.ts";

export type DashboardMetrics = {
	totalMods: number | undefined;
	downloads: number | undefined;
	enabled: number | undefined;
	outdated: number | undefined;
};

export function useDashboardMetrics(): DashboardMetrics {
	const totalPublicMods = useGetCountTotalPublicMods();

	const allDaemonReleases = useGetAllDaemonReleases();

	const outdated = useAsync(async () => {
		if (!allDaemonReleases.data?.data) {
			return undefined;
		}

		const modsWithLatest: Array<{ modId: string; releaseId: string; latestReleaseId: string }> = [];

		for (const release of allDaemonReleases.data.data) {
			const latest = await memoizedGetLatestModReleaseById.call(release.modId);
			if (latest.status === StatusCodes.OK) {
				modsWithLatest.push({
					modId: release.modId,
					releaseId: release.releaseId,
					latestReleaseId: latest.data.id,
				});
			}
		}

		return modsWithLatest;
	}, [allDaemonReleases.data?.data]);

	if (
		allDaemonReleases.data?.status !== StatusCodes.OK ||
		totalPublicMods.data?.status !== StatusCodes.OK ||
		outdated.value === undefined
	) {
		return {
			totalMods: undefined,
			downloads: undefined,
			enabled: undefined,
			outdated: undefined,
		};
	}

	return {
		totalMods: totalPublicMods.data.data.totalMods,
		outdated: outdated.value.filter((it) => it.releaseId !== it.latestReleaseId).length,
		downloads: allDaemonReleases.data.data.length,
		enabled: allDaemonReleases.data.data.filter((it) => it.status === ModAndReleaseDataStatus.ENABLED).length,
	};
}

import { ModAndReleaseDataStatus, useGetAllDaemonReleases } from "@packages/clients/daemon";
import { useGetServerMetrics } from "@packages/clients/webapp";
import { StatusCodes } from "http-status-codes";
import { useAsync } from "react-use";
import { memoizedGetLatestModReleaseById } from "../utils/MemoizedGetLatestModReleaseById.ts";

export type DashboardMetrics = {
	totalMods: number | undefined;
	totalDownloads: number | undefined;
	downloads: number | undefined;
	enabled: number | undefined;
	outdated: number | undefined;
};

export function useDashboardMetrics(): DashboardMetrics {
	const serverMetrics = useGetServerMetrics();
	const totalMods = serverMetrics.data?.status === StatusCodes.OK ? serverMetrics.data?.data.totalMods : undefined;
	const totalDownloads =
		serverMetrics.data?.status === StatusCodes.OK ? serverMetrics.data?.data.totalDownloads : undefined;

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

	if (allDaemonReleases.data?.status !== StatusCodes.OK || outdated.value === undefined) {
		return {
			totalMods,
			totalDownloads,
			downloads: undefined,
			enabled: undefined,
			outdated: undefined,
		};
	}

	return {
		totalMods,
		totalDownloads,
		outdated: outdated.value.filter((it) => it.releaseId !== it.latestReleaseId).length,
		downloads: allDaemonReleases.data.data.length,
		enabled: allDaemonReleases.data.data.filter((it) => it.status === ModAndReleaseDataStatus.ENABLED).length,
	};
}

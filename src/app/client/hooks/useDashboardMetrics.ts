import { useEffect } from "react";
import { type GetServerDashboardMetricsBodyItem, useGetServerDashboardMetrics } from "../_autogen/api.ts";
import { ModAndReleaseDataStatus, useGetAllDaemonReleases } from "../_autogen/daemon_api.ts";

export type DashboardMetrics = {
	totalMods: number | undefined;
	downloads: number | undefined;
	enabled: number | undefined;
	outdated: number | undefined;
};

export function useDashboardMetrics(): DashboardMetrics {
	const allDaemonReleases = useGetAllDaemonReleases();
	const metrics = useGetServerDashboardMetrics();

	useEffect(() => {
		metrics.mutate({
			data:
				allDaemonReleases.data?.data.map(
					(it): GetServerDashboardMetricsBodyItem => ({
						modId: it.modId,
						releaseId: it.releaseId,
					}),
				) || [],
		});
	}, [allDaemonReleases.data, metrics.mutate]);

	return {
		totalMods: metrics.data?.status === 200 ? metrics.data.data.totalMods : undefined,
		downloads: allDaemonReleases.data?.status === 200 ? allDaemonReleases.data.data.length : undefined,
		enabled:
			allDaemonReleases.data?.status === 200
				? allDaemonReleases.data.data.filter((it) => it.status === ModAndReleaseDataStatus.ENABLED).length
				: undefined,
		outdated: metrics.data?.status === 200 ? metrics.data.data.outdated : undefined,
	};
}

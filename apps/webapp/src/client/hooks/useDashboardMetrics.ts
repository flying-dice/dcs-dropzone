import { useEffect, useState } from "react";
import {
	type GetServerDashboardMetrics200,
	type GetServerDashboardMetricsBodyItem,
	useGetServerDashboardMetrics,
} from "../_autogen/api.ts";
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

	const [metricsCache, setMetricsCache] = useState<GetServerDashboardMetrics200 | null>(null);

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

	useEffect(() => {
		if (metrics.data?.status === 200) {
			setMetricsCache(metrics.data.data);
		}
	}, [metrics.data]);

	return {
		totalMods: metricsCache ? metricsCache.totalMods : undefined,
		downloads: allDaemonReleases.data?.status === 200 ? allDaemonReleases.data.data.length : undefined,
		enabled:
			allDaemonReleases.data?.status === 200
				? allDaemonReleases.data.data.filter((it) => it.status === ModAndReleaseDataStatus.ENABLED).length
				: undefined,
		outdated: metricsCache ? metricsCache.outdated : undefined,
	};
}

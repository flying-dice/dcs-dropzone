import { type ModAndReleaseData, ModAndReleaseDataStatus } from "./daemon";
import { getLatestModReleaseById, getServerMetrics } from "./webapp";

export type DashboardMetrics = {
	totalMods: number | undefined;
	totalDownloads: number | undefined;
	downloads: number | undefined;
	enabled: number | undefined;
	outdated: number | undefined;
};

export async function calculateDashboardMetrics(allDaemonReleases?: ModAndReleaseData[]): Promise<DashboardMetrics> {
	const metricsRes = await getServerMetrics();

	if (metricsRes.status !== 200) {
		throw new Error("Failed to fetch server metrics");
	}

	const totalMods = metricsRes.data.totalMods;
	const totalDownloads = metricsRes.data.totalDownloads;

	// Short-circuit if we dont have daemon releases, as we won't be able to calculate downloads, enabled, or outdated metrics
	if (!allDaemonReleases) {
		return {
			totalMods,
			totalDownloads,
			downloads: undefined,
			enabled: undefined,
			outdated: undefined,
		};
	}

	const enabledMods: ModAndReleaseData[] = allDaemonReleases.filter(
		(release) => release.status === ModAndReleaseDataStatus.ENABLED,
	);

	const outdatedMods: ModAndReleaseData[] = [];

	for (const release of allDaemonReleases) {
		const latestReleaseRes = await getLatestModReleaseById(release.modId).catch(() => null);
		if (latestReleaseRes?.status === 200 && latestReleaseRes.data.id !== release.releaseId) {
			outdatedMods.push(release);
		}
	}

	return {
		totalMods,
		totalDownloads,
		downloads: allDaemonReleases.length,
		enabled: enabledMods.length,
		outdated: outdatedMods.length,
	};
}

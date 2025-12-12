import { addMinutes } from "date-fns";
import { StatusCodes } from "http-status-codes";
import { useAsync } from "react-use";
import {
	type GetServerDashboardMetricsBodyItem,
	getServerDashboardMetrics,
	type getServerDashboardMetricsResponse,
} from "../_autogen/api.ts";
import {
	type getAllDaemonReleasesResponse200,
	type getAllDaemonReleasesResponseSuccess,
	ModAndReleaseDataStatus,
	useGetAllDaemonReleases,
} from "../_autogen/daemon_api.ts";

export type DashboardMetrics = {
	totalMods: number | undefined;
	downloads: number | undefined;
	enabled: number | undefined;
	outdated: number | undefined;
};

type getAllDaemonReleasesResponse200WithItems = getAllDaemonReleasesResponse200 & {
	items: GetServerDashboardMetricsBodyItem[];
};

const selector = (res: getAllDaemonReleasesResponseSuccess): getAllDaemonReleasesResponse200WithItems => {
	const items = res.data.map((it) => ({
		modId: it.modId,
		releaseId: it.releaseId,
	}));

	return { ...res, items };
};

function makeItemsEtag(items: GetServerDashboardMetricsBodyItem[]): string {
	return items
		.map((it) => `${it.modId}:${it.releaseId}`)
		.sort()
		.join("|");
}

type CacheEntry = {
	etag: string;
	expires: Date;
	data?: getServerDashboardMetricsResponse;
	inFlight?: Promise<getServerDashboardMetricsResponse>;
};

let cached: CacheEntry | null = null;

/**
 * Reduces the load on the server by caching the results for 5 minutes based on the input items.
 * Daemon Can be hit frequently to get the list of mods, so this helps to reduce the number of requests to the server,
 * which is a side effect of that checking if the daemons mods are up to date.
 *
 * Annoyingly, React Query would cache if we used GET. However, we need to use POST here due to the potentially large body size,
 * if we just used GET the URL could get too long, so React Query things it's a "mutation" and doesn't cache it or debounce it.
 */
function useGetServerDashboardMetrics(items?: GetServerDashboardMetricsBodyItem[]) {
	return useAsync(async () => {
		if (!items) return undefined;

		const etag = makeItemsEtag(items);
		const now = new Date();

		// 1) Serve cached data if fresh
		if (cached && cached.etag === etag && cached.data && cached.expires > now) {
			return cached.data;
		}

		// 2) Dedupe in-flight request
		if (cached && cached.etag === etag && cached.inFlight) {
			return cached.inFlight;
		}

		// 3) Start request and store as in-flight
		const p = getServerDashboardMetrics(items);

		cached = {
			etag,
			expires: addMinutes(now, 5),
			inFlight: p,
		};

		try {
			const data = await p;

			// Only commit if we’re still on the same etag
			if (cached?.etag === etag) {
				cached.data = data;
				cached.inFlight = undefined; // drop promise after success
			}

			return data;
		} catch (err) {
			// Don’t keep a rejected promise around
			if (cached?.etag === etag) {
				cached = null;
			}
			throw err;
		}
	}, [items]);
}

export function useDashboardMetrics(): DashboardMetrics {
	const allDaemonReleases = useGetAllDaemonReleases({
		query: { select: selector },
	});

	const metrics = useGetServerDashboardMetrics(allDaemonReleases.data?.items);

	if (allDaemonReleases.data?.status !== StatusCodes.OK || metrics.value?.status !== StatusCodes.OK) {
		return {
			totalMods: undefined,
			downloads: undefined,
			enabled: undefined,
			outdated: undefined,
		};
	}

	return {
		totalMods: metrics.value.data.totalMods,
		outdated: metrics.value.data.outdated,
		downloads: allDaemonReleases.data.data.length,
		enabled: allDaemonReleases.data.data.filter((it) => it.status === ModAndReleaseDataStatus.ENABLED).length,
	};
}

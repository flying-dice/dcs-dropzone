import type { T_DOWNLOAD_QUEUE, T_EXTRACT_QUEUE } from "../database/schema.ts";
import { AssetStatus } from "../enums/AssetStatus.ts";
import { DownloadJobStatus } from "../enums/DownloadJobStatus.ts";
import { ExtractJobStatus } from "../enums/ExtractJobStatus.ts";

export function inferAssetStatusFromJobs(
	downloadJobs: (typeof T_DOWNLOAD_QUEUE.$inferSelect)[],
	extractJobs: (typeof T_EXTRACT_QUEUE.$inferSelect)[],
): AssetStatus {
	const downloadJobStatuses = downloadJobs.map((it) => it.status);
	const extractJobStatuses = extractJobs.map((it) => it.status);

	if (
		downloadJobStatuses.some((status) => status === DownloadJobStatus.ERROR) ||
		extractJobStatuses.some((status) => status === ExtractJobStatus.ERROR)
	) {
		return AssetStatus.ERROR;
	}

	if (
		downloadJobStatuses.every((status) => status === DownloadJobStatus.PENDING) &&
		extractJobStatuses.every((status) => status === ExtractJobStatus.PENDING)
	) {
		return AssetStatus.PENDING;
	}

	if (
		downloadJobStatuses.every((status) => status === DownloadJobStatus.COMPLETED) &&
		extractJobStatuses.every((status) => status === ExtractJobStatus.COMPLETED)
	) {
		return AssetStatus.COMPLETED;
	}

	return AssetStatus.IN_PROGRESS;
}

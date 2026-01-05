import { JobState } from "@packages/queue";
import { AssetStatus } from "../enums/AssetStatus.ts";

export function inferAssetStatusFromJobs(
	downloadJobs: { state: JobState }[],
	extractJobs: { state: JobState }[],
): AssetStatus {
	const downloadJobStatuses = downloadJobs.map((it) => it.state);
	const extractJobStatuses = extractJobs.map((it) => it.state);

	if (
		downloadJobStatuses.some((status) => status === JobState.Failed) ||
		extractJobStatuses.some((status) => status === JobState.Failed)
	) {
		return AssetStatus.ERROR;
	}

	if (
		downloadJobStatuses.every((status) => status === JobState.Pending) &&
		extractJobStatuses.every((status) => status === JobState.Pending)
	) {
		return AssetStatus.PENDING;
	}

	if (
		downloadJobStatuses.every((status) => status === JobState.Success) &&
		extractJobStatuses.every((status) => status === JobState.Success)
	) {
		return AssetStatus.COMPLETED;
	}

	return AssetStatus.IN_PROGRESS;
}

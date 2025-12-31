import type { DownloadJob } from "../schemas/DownloadJob.ts";

export interface DownloadQueue {
	pushJob(
		id: string,
		releaseId: string,
		releaseAssetId: string,
		urlId: string,
		url: string,
		targetDirectory: string,
	): void;

	cancelJobsForRelease(releaseId: string): void;

	getJobsForReleaseId(releaseId: string): DownloadJob[];

	getJobsForReleaseAssetId(releaseAssetId: string): DownloadJob[];
}

import type { DownloadJob } from "./types.ts";

export interface DownloadQueue {
	pushJob(releaseId: string, releaseAssetId: string, id: string, url: string, targetDirectory: string): void;

	cancelJobsForRelease(releaseId: string): void;

	getJobsForReleaseId(releaseId: string): DownloadJob[];

	getJobsForReleaseAssetId(releaseAssetId: string): DownloadJob[];
}

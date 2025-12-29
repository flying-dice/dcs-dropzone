import type { DownloadJobStatus } from "../enums/DownloadJobStatus.ts";

/**
 * Download job information
 */
export type DownloadJob = {
	id: string;
	releaseId: string;
	releaseAssetId: string;
	url: string;
	targetDirectory: string;
	status: DownloadJobStatus;
	progressPercent: number;
	attempt: number;
	nextAttemptAfter: Date;
	createdAt: Date;
};

export interface DownloadQueue {
	pushJob(releaseId: string, releaseAssetId: string, id: string, url: string, targetDirectory: string): void;

	cancelJobsForRelease(releaseId: string): void;

	getJobsForReleaseId(releaseId: string): DownloadJob[];

	getJobsForReleaseAssetId(releaseAssetId: string): DownloadJob[];
}

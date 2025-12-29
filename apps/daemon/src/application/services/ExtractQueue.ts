import type { ExtractJobStatus } from "../enums/ExtractJobStatus.ts";

export interface ExtractQueue {
	pushJob(
		releaseId: string,
		releaseAssetId: string,
		id: string,
		archivePath: string,
		targetDirectory: string,
		downloadJobIds: string[],
	): void;

	cancelJobsForRelease(releaseId: string): void;

	getJobsForReleaseId(releaseId: string): {
		id: string;
		releaseId: string;
		releaseAssetId: string;
		archivePath: string;
		targetDirectory: string;
		status: ExtractJobStatus;
		progressPercent: number;
		attempt: number;
		nextAttemptAfter: Date;
		createdAt: Date;
	}[];

	getJobsForReleaseAssetId(releaseAssetId: string): {
		id: string;
		releaseId: string;
		releaseAssetId: string;
		archivePath: string;
		targetDirectory: string;
		status: ExtractJobStatus;
		progressPercent: number;
		attempt: number;
		nextAttemptAfter: Date;
		createdAt: Date;
	}[];
}

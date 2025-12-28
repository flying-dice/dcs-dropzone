import type { DownloadJobStatus } from "../enums/DownloadJobStatus.ts";

export interface GetDownloadJobsForReleaseAssetId {
	execute(releaseAssetId: string): {
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
	}[];
}

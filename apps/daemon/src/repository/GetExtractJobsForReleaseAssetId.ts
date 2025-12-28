import type { ExtractJobStatus } from "../enums/ExtractJobStatus.ts";

export interface GetExtractJobsForReleaseAssetId {
	execute(releaseAssetId: string): {
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

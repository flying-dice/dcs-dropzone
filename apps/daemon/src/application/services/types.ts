import type { DownloadJobStatus } from "../enums/DownloadJobStatus.ts";
import type { ExtractJobStatus } from "../enums/ExtractJobStatus.ts";

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

/**
 * Extract job information
 */
export type ExtractJob = {
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
};

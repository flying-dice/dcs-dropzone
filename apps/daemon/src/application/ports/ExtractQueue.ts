import type { ExtractJob } from "../schemas/ExtractJob.ts";

export interface ExtractQueue {
	pushJob(
		id: string,
		releaseId: string,
		releaseAssetId: string,
		archivePath: string,
		targetDirectory: string,
		downloadJobIds: string[],
	): void;

	cancelJobsForRelease(releaseId: string): void;

	getJobsForReleaseId(releaseId: string): ExtractJob[];

	getJobsForReleaseAssetId(releaseAssetId: string): ExtractJob[];
}

import type { ExtractJob } from "./types.ts";

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

	getJobsForReleaseId(releaseId: string): ExtractJob[];

	getJobsForReleaseAssetId(releaseAssetId: string): ExtractJob[];
}

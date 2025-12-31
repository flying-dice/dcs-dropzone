import { mock } from "bun:test";
import type { DownloadQueue } from "./DownloadQueue.ts";

export class TestDownloadQueue implements DownloadQueue {
	getJobsForReleaseId = mock<DownloadQueue["getJobsForReleaseId"]>();
	getJobsForReleaseAssetId = mock<DownloadQueue["getJobsForReleaseAssetId"]>();
	pushJob = mock<DownloadQueue["pushJob"]>();
	cancelJobsForRelease = mock<DownloadQueue["cancelJobsForRelease"]>();
}

import { mock } from "bun:test";
import type { ExtractQueue } from "./ExtractQueue.ts";

export class TestExtractQueue implements ExtractQueue {
	cancelJobsForRelease = mock<ExtractQueue["cancelJobsForRelease"]>();
	getJobsForReleaseAssetId = mock<ExtractQueue["getJobsForReleaseAssetId"]>();
	getJobsForReleaseId = mock<ExtractQueue["getJobsForReleaseId"]>();
	pushJob = mock<ExtractQueue["pushJob"]>();
}

import { expect } from "bun:test";
import * as inspector from "node:inspector";
import { join } from "node:path";
import { differenceInSeconds } from "date-fns";
import { DownloadJobStatus } from "../application/enums/DownloadJobStatus.ts";
import { ExtractJobStatus } from "../application/enums/ExtractJobStatus.ts";
import type { DownloadQueue } from "../application/ports/DownloadQueue.ts";
import type { ExtractQueue } from "../application/ports/ExtractQueue.ts";

export function getAllPathsForTree(path: string) {
	const glob = new Bun.Glob(join(path, "**/*"));
	return Array.from(glob.scanSync({ followSymlinks: true }));
}

export async function waitForDownloadJobsForRelease(
	queue: DownloadQueue,
	releaseId: string,
	timeoutSeconds: number = 30,
	expectedJobCount: number = 1,
): Promise<void> {
	inspector.console.log("Waiting for download and extract jobs to complete...");
	const downloadWaitStartTime = Date.now();

	const jobs = queue.getJobsForReleaseId(releaseId);
	expect(jobs.length).toEqual(expectedJobCount);

	while (queue.getJobsForReleaseId(releaseId).some((it) => it.status !== DownloadJobStatus.COMPLETED)) {
		if (differenceInSeconds(Date.now(), downloadWaitStartTime) > timeoutSeconds) {
			const error = new Error(`Timeout waiting for download jobs to complete: ${jobs}`);
			inspector.console.error({ jobs, error });
			throw error;
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
}

export async function waitForExtractJobsForRelease(
	queue: ExtractQueue,
	releaseId: string,
	timeoutSeconds: number = 30,
	expectedJobCount: number = 1,
): Promise<void> {
	inspector.console.log("Waiting for extract jobs to complete...");
	const extractWaitStartTime = Date.now();

	const jobs = queue.getJobsForReleaseId(releaseId);
	expect(jobs.length).toEqual(expectedJobCount);

	while (queue.getJobsForReleaseId(releaseId).some((it) => it.status !== ExtractJobStatus.COMPLETED)) {
		if (differenceInSeconds(Date.now(), extractWaitStartTime) > timeoutSeconds) {
			const error = new Error(`Timeout waiting for extract jobs to complete: ${JSON.stringify(jobs, undefined, 2)}`);
			inspector.console.error({ jobs, error });
			throw error;
		}
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
}

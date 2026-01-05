import * as inspector from "node:inspector";
import { join } from "node:path";
import { type JobRecordRepository, JobState } from "@packages/queue";
import { differenceInSeconds } from "date-fns";
import { compact } from "lodash";
import { getLogger } from "log4js";
import type { ReleaseRepository } from "../application/ports/ReleaseRepository.ts";

export function getAllPathsForTree(path: string) {
	const glob = new Bun.Glob(join(path, "**/*"));
	return Array.from(glob.scanSync({ followSymlinks: true }));
}

export async function waitForJobsForRelease(
	deps: { releaseRepository: ReleaseRepository; jobRecordRepository: JobRecordRepository },
	releaseId: string,
	timeoutSeconds: number = 30,
): Promise<void> {
	inspector.console.log("Waiting for jobs to complete...");
	const extractWaitStartTime = Date.now();

	const getJobs = () => {
		const jobIds = deps.releaseRepository.getJobIdsForRelease(releaseId);
		const jobs = compact(jobIds.map((it) => deps.jobRecordRepository.findLatestByJobId(it)));

		getLogger("waitForJobsForRelease").info(jobs);

		return jobs;
	};

	while (getJobs().some((it) => [JobState.Pending, JobState.Waiting, JobState.Running].includes(it.state))) {
		if (differenceInSeconds(Date.now(), extractWaitStartTime) > timeoutSeconds) {
			const error = new Error(`Timeout waiting for extract jobs to complete.`);
			inspector.console.error({ error });
			throw error;
		}
		await delay(250);
	}
}

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}

		const timeoutId = setTimeout(resolve, ms);

		signal?.addEventListener(
			"abort",
			() => {
				clearTimeout(timeoutId);
				reject(new DOMException("Aborted", "AbortError"));
			},
			{ once: true },
		);
	});
}

import { ExtractJobStatus } from "../enums/ExtractJobStatus.ts";
import type { ExtractQueue } from "../ports/ExtractQueue.ts";
import type { ExtractJob } from "../schemas/ExtractJob.ts";

export class TestExtractQueue implements ExtractQueue {
	private readonly jobs = new Map<string, ExtractJob>();
	private readonly dependencies: Map<string, string[]> = new Map();

	pushJob(
		id: string,
		releaseId: string,
		releaseAssetId: string,
		archivePath: string,
		targetDirectory: string,
		downloadJobIds: string[],
	): void {
		const job: ExtractJob = {
			id,
			releaseId,
			releaseAssetId,
			archivePath,
			targetDirectory,
			status: ExtractJobStatus.PENDING,
			progressPercent: 0,
			attempt: 0,
			nextAttemptAfter: new Date(),
			createdAt: new Date(),
		};
		this.jobs.set(id, job);
		this.dependencies.set(id, downloadJobIds);
	}

	cancelJobsForRelease(releaseId: string): void {
		for (const [id, job] of this.jobs) {
			if (job.releaseId === releaseId) {
				this.jobs.delete(id);
				this.dependencies.delete(id);
			}
		}
	}

	getJobsForReleaseId(releaseId: string): ExtractJob[] {
		return this.jobs
			.values()
			.filter((job) => job.releaseId === releaseId)
			.toArray();
	}

	getJobsForReleaseAssetId(releaseAssetId: string): ExtractJob[] {
		return this.jobs
			.values()
			.filter((job) => job.releaseAssetId === releaseAssetId)
			.toArray();
	}
}

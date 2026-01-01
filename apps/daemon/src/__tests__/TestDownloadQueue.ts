import { DownloadJobStatus } from "../application/enums/DownloadJobStatus.ts";
import type { DownloadQueue } from "../application/ports/DownloadQueue.ts";
import type { DownloadJob } from "../application/schemas/DownloadJob.ts";

export class TestDownloadQueue implements DownloadQueue {
	private readonly jobs = new Map<string, DownloadJob>();

	pushJob(
		id: string,
		releaseId: string,
		releaseAssetId: string,
		urlId: string,
		url: string,
		targetDirectory: string,
	): void {
		const job: DownloadJob = {
			id,
			releaseId,
			releaseAssetId,
			urlId,
			url,
			targetDirectory,
			status: DownloadJobStatus.PENDING,
			progressPercent: 0,
			attempt: 0,
			nextAttemptAfter: new Date(),
			createdAt: new Date(),
		};
		this.jobs.set(id, job);
	}

	cancelJobsForRelease(releaseId: string): void {
		for (const [id, job] of this.jobs) {
			if (job.releaseId === releaseId) {
				this.jobs.delete(id);
			}
		}
	}

	getJobsForReleaseId(releaseId: string): DownloadJob[] {
		return this.jobs
			.values()
			.filter((job) => job.releaseId === releaseId)
			.toArray();
	}

	getJobsForReleaseAssetId(releaseAssetId: string): DownloadJob[] {
		return this.jobs
			.values()
			.filter((job) => job.releaseAssetId === releaseAssetId)
			.toArray();
	}
}

import { ExtractJobStatus } from "../application/enums/ExtractJobStatus.ts";
import type { ExtractQueue } from "../application/ports/ExtractQueue.ts";
import type { ExtractJob } from "../application/schemas/ExtractJob.ts";

export class TestExtractQueue implements ExtractQueue {
	private readonly jobs = new Map<string, ExtractJob>();
	private readonly dependencies: Map<string, string[]> = new Map();

	constructor() {
		setInterval(() => {
			for (const [id, job] of this.jobs) {
				if (job.status === ExtractJobStatus.PENDING) {
					job.status = ExtractJobStatus.IN_PROGRESS;
					job.attempt += 1;
					job.progressPercent = 0;
				} else if (job.status === ExtractJobStatus.IN_PROGRESS) {
					job.progressPercent = Math.min(100, job.progressPercent + 50);
					if (job.progressPercent >= 100) {
						job.status = ExtractJobStatus.COMPLETED;
					}
				}
				this.jobs.set(id, job);
			}
		}, 500);
	}

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

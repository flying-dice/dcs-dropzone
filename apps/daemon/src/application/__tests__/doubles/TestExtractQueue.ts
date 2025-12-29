import { ExtractJobStatus } from "../../enums/ExtractJobStatus.ts";
import type { ExtractQueue } from "../../services/ExtractQueue.ts";
import type { ExtractJob } from "../../services/types.ts";

export class TestExtractQueue implements ExtractQueue {
	public pushedJobs: Array<{
		releaseId: string;
		assetId: string;
		jobId: string;
		archivePath: string;
		destination: string;
		downloadJobIds: string[];
	}> = [];
	public canceledReleases: string[] = [];

	private jobs: Map<
		string,
		Array<{
			id: string;
			releaseId: string;
			assetId: string;
			status: ExtractJobStatus;
			progressPercent: number;
		}>
	> = new Map();

	pushJob(
		releaseId: string,
		assetId: string,
		jobId: string,
		archivePath: string,
		destination: string,
		downloadJobIds: string[],
	): void {
		this.pushedJobs.push({ releaseId, assetId, jobId, archivePath, destination, downloadJobIds });
		const job = {
			id: jobId,
			releaseId,
			assetId,
			status: ExtractJobStatus.PENDING,
			progressPercent: 0,
		};
		const existing = this.jobs.get(assetId) || [];
		existing.push(job);
		this.jobs.set(assetId, existing);
	}

	getJobsForReleaseAssetId(releaseAssetId: string): ExtractJob[] {
		const jobs = this.jobs.get(releaseAssetId) || [];
		return jobs.map((job) => ({
			...job,
			releaseAssetId: job.assetId,
			archivePath: "/archive",
			targetDirectory: "/dest",
			attempt: 0,
			nextAttemptAfter: new Date(),
			createdAt: new Date(),
		}));
	}

	getJobsForReleaseId(releaseId: string): ExtractJob[] {
		const result: ExtractJob[] = [];
		for (const jobs of this.jobs.values()) {
			for (const job of jobs) {
				if (job.releaseId === releaseId) {
					result.push({
						...job,
						releaseAssetId: job.assetId,
						archivePath: "/archive",
						targetDirectory: "/dest",
						attempt: 0,
						nextAttemptAfter: new Date(),
						createdAt: new Date(),
					});
				}
			}
		}
		return result;
	}

	cancelJobsForRelease(releaseId: string): void {
		this.canceledReleases.push(releaseId);
		for (const [assetId, jobs] of this.jobs.entries()) {
			this.jobs.set(
				assetId,
				jobs.filter((j) => j.releaseId !== releaseId),
			);
		}
	}

	setJobStatus(assetId: string, jobId: string, status: ExtractJobStatus, progressPercent = 0): void {
		const jobs = this.jobs.get(assetId);
		if (jobs) {
			const job = jobs.find((j) => j.id === jobId);
			if (job) {
				job.status = status;
				job.progressPercent = progressPercent;
			}
		}
	}
}

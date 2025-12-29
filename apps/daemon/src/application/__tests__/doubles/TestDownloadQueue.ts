import { DownloadJobStatus } from "../../enums/DownloadJobStatus.ts";
import type { DownloadQueue } from "../../services/DownloadQueue.ts";

export class TestDownloadQueue implements DownloadQueue {
	public pushedJobs: Array<{
		releaseId: string;
		assetId: string;
		jobId: string;
		url: string;
		destination: string;
	}> = [];
	public canceledReleases: string[] = [];

	private jobs: Map<
		string,
		Array<{
			id: string;
			releaseId: string;
			assetId: string;
			url: string;
			status: DownloadJobStatus;
			progressPercent: number;
		}>
	> = new Map();

	pushJob(releaseId: string, assetId: string, jobId: string, url: string, destination: string): void {
		this.pushedJobs.push({ releaseId, assetId, jobId, url, destination });
		const job = {
			id: jobId,
			releaseId,
			assetId,
			url,
			status: DownloadJobStatus.PENDING,
			progressPercent: 0,
		};
		const existing = this.jobs.get(assetId) || [];
		existing.push(job);
		this.jobs.set(assetId, existing);
	}

	getJobsForReleaseAssetId(releaseAssetId: string): Array<{
		id: string;
		releaseId: string;
		releaseAssetId: string;
		url: string;
		targetDirectory: string;
		status: DownloadJobStatus;
		progressPercent: number;
		attempt: number;
		nextAttemptAfter: Date;
		createdAt: Date;
	}> {
		const jobs = this.jobs.get(releaseAssetId) || [];
		return jobs.map((job) => ({
			...job,
			releaseAssetId: job.assetId,
			targetDirectory: "/dest",
			attempt: 0,
			nextAttemptAfter: new Date(),
			createdAt: new Date(),
		}));
	}

	getJobsForReleaseId(releaseId: string): Array<{
		id: string;
		releaseId: string;
		releaseAssetId: string;
		url: string;
		targetDirectory: string;
		status: DownloadJobStatus;
		progressPercent: number;
		attempt: number;
		nextAttemptAfter: Date;
		createdAt: Date;
	}> {
		const result: Array<{
			id: string;
			releaseId: string;
			releaseAssetId: string;
			url: string;
			targetDirectory: string;
			status: DownloadJobStatus;
			progressPercent: number;
			attempt: number;
			nextAttemptAfter: Date;
			createdAt: Date;
		}> = [];
		for (const jobs of this.jobs.values()) {
			for (const job of jobs) {
				if (job.releaseId === releaseId) {
					result.push({
						...job,
						releaseAssetId: job.assetId,
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

	setJobStatus(assetId: string, jobId: string, status: DownloadJobStatus, progressPercent = 0): void {
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

import { describe, expect, it } from "bun:test";
import { ExtractJobStatus } from "../../enums/ExtractJobStatus.ts";
import { TestExtractQueue } from "./TestExtractQueue.ts";

describe("TestExtractQueue", () => {
	describe("pushJob", () => {
		it("tracks pushed jobs", () => {
			const queue = new TestExtractQueue();
			queue.pushJob("release-1", "asset-1", "job-1", "/archive.zip", "/dest", ["download-1"]);

			expect(queue.pushedJobs).toHaveLength(1);
			expect(queue.pushedJobs[0]).toEqual({
				releaseId: "release-1",
				assetId: "asset-1",
				jobId: "job-1",
				archivePath: "/archive.zip",
				destination: "/dest",
				downloadJobIds: ["download-1"],
			});
		});

		it("creates job with PENDING status", () => {
			const queue = new TestExtractQueue();
			queue.pushJob("release-1", "asset-1", "job-1", "/archive.zip", "/dest", ["download-1"]);

			const jobs = queue.getJobsForReleaseAssetId("asset-1");
			expect(jobs).toHaveLength(1);
			expect(jobs[0]?.status).toBe(ExtractJobStatus.PENDING);
			expect(jobs[0]?.progressPercent).toBe(0);
		});

		it("supports multiple jobs for same asset", () => {
			const queue = new TestExtractQueue();
			queue.pushJob("release-1", "asset-1", "job-1", "/archive1.zip", "/dest", ["download-1"]);
			queue.pushJob("release-1", "asset-1", "job-2", "/archive2.zip", "/dest", ["download-2"]);

			const jobs = queue.getJobsForReleaseAssetId("asset-1");
			expect(jobs).toHaveLength(2);
		});
	});

	describe("getJobsForReleaseAssetId", () => {
		it("returns jobs for specific asset", () => {
			const queue = new TestExtractQueue();
			queue.pushJob("release-1", "asset-1", "job-1", "/archive1.zip", "/dest", ["download-1"]);
			queue.pushJob("release-1", "asset-2", "job-2", "/archive2.zip", "/dest", ["download-2"]);

			const jobs = queue.getJobsForReleaseAssetId("asset-1");
			expect(jobs).toHaveLength(1);
			expect(jobs[0]?.id).toBe("job-1");
		});

		it("returns empty array for non-existent asset", () => {
			const queue = new TestExtractQueue();
			const jobs = queue.getJobsForReleaseAssetId("non-existent");
			expect(jobs).toHaveLength(0);
		});

		it("returns complete job objects with all required fields", () => {
			const queue = new TestExtractQueue();
			queue.pushJob("release-1", "asset-1", "job-1", "/archive.zip", "/dest", ["download-1"]);

			const jobs = queue.getJobsForReleaseAssetId("asset-1");
			const job = jobs[0]!;

			expect(job.id).toBe("job-1");
			expect(job.releaseId).toBe("release-1");
			expect(job.releaseAssetId).toBe("asset-1");
			expect(job.archivePath).toBe("/archive");
			expect(job.targetDirectory).toBe("/dest");
			expect(job.status).toBe(ExtractJobStatus.PENDING);
			expect(job.progressPercent).toBe(0);
			expect(job.attempt).toBe(0);
			expect(job.nextAttemptAfter).toBeInstanceOf(Date);
			expect(job.createdAt).toBeInstanceOf(Date);
		});
	});

	describe("getJobsForReleaseId", () => {
		it("returns all jobs for a release", () => {
			const queue = new TestExtractQueue();
			queue.pushJob("release-1", "asset-1", "job-1", "/archive1.zip", "/dest", ["download-1"]);
			queue.pushJob("release-1", "asset-2", "job-2", "/archive2.zip", "/dest", ["download-2"]);
			queue.pushJob("release-2", "asset-3", "job-3", "/archive3.zip", "/dest", ["download-3"]);

			const jobs = queue.getJobsForReleaseId("release-1");
			expect(jobs).toHaveLength(2);
			expect(jobs.every((j) => j.releaseId === "release-1")).toBe(true);
		});

		it("returns empty array for non-existent release", () => {
			const queue = new TestExtractQueue();
			const jobs = queue.getJobsForReleaseId("non-existent");
			expect(jobs).toHaveLength(0);
		});
	});

	describe("cancelJobsForRelease", () => {
		it("tracks canceled releases", () => {
			const queue = new TestExtractQueue();
			queue.cancelJobsForRelease("release-1");
			queue.cancelJobsForRelease("release-2");

			expect(queue.canceledReleases).toHaveLength(2);
			expect(queue.canceledReleases).toContain("release-1");
			expect(queue.canceledReleases).toContain("release-2");
		});

		it("removes jobs for canceled release", () => {
			const queue = new TestExtractQueue();
			queue.pushJob("release-1", "asset-1", "job-1", "/archive1.zip", "/dest", ["download-1"]);
			queue.pushJob("release-2", "asset-2", "job-2", "/archive2.zip", "/dest", ["download-2"]);

			queue.cancelJobsForRelease("release-1");

			const release1Jobs = queue.getJobsForReleaseId("release-1");
			const release2Jobs = queue.getJobsForReleaseId("release-2");

			expect(release1Jobs).toHaveLength(0);
			expect(release2Jobs).toHaveLength(1);
		});
	});

	describe("setJobStatus", () => {
		it("updates job status and progress", () => {
			const queue = new TestExtractQueue();
			queue.pushJob("release-1", "asset-1", "job-1", "/archive.zip", "/dest", ["download-1"]);
			queue.setJobStatus("job-1", ExtractJobStatus.IN_PROGRESS, 50);

			const jobs = queue.getJobsForReleaseAssetId("asset-1");
			expect(jobs[0]?.status).toBe(ExtractJobStatus.IN_PROGRESS);
			expect(jobs[0]?.progressPercent).toBe(50);
		});

		it("does nothing for non-existent job", () => {
			const queue = new TestExtractQueue();
			expect(() => {
				queue.setJobStatus("non-existent", ExtractJobStatus.COMPLETED, 100);
			}).not.toThrow();
		});

		it("sets progress to 0 by default", () => {
			const queue = new TestExtractQueue();
			queue.pushJob("release-1", "asset-1", "job-1", "/archive.zip", "/dest", ["download-1"]);
			queue.setJobStatus("job-1", ExtractJobStatus.COMPLETED);

			const jobs = queue.getJobsForReleaseAssetId("asset-1");
			expect(jobs[0]?.progressPercent).toBe(0);
		});
	});
});

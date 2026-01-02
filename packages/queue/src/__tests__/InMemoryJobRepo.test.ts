import { beforeEach, describe, expect, it } from "bun:test";
import { InMemoryJobRepo } from "../adapters";
import type { Job } from "../index.ts";

describe("InMemoryJobRepo", () => {
	let repo: InMemoryJobRepo;

	beforeEach(() => {
		repo = new InMemoryJobRepo();
	});

	function createJob(overrides: Partial<Job> = {}): Job {
		return {
			id: crypto.randomUUID(),
			queue: "test",
			name: "testJob",
			data: {},
			createdAt: new Date(),
			scheduledAt: new Date(),
			attempts: 0,
			...overrides,
		};
	}

	describe("create", () => {
		it("should create and return the job", async () => {
			const job = createJob({ id: "job-1" });
			const created = await repo.create(job);

			expect(created).toEqual(job);
		});

		it("should store the job retrievable by id", async () => {
			const job = createJob({ id: "job-1" });
			await repo.create(job);

			const found = await repo.findById("job-1");
			expect(found).toEqual(job);
		});
	});

	describe("findById", () => {
		it("should return undefined for non-existent job", async () => {
			const found = await repo.findById("non-existent");
			expect(found).toBeUndefined();
		});

		it("should return a copy of the job", async () => {
			const job = createJob({ id: "job-1" });
			await repo.create(job);

			const found = await repo.findById("job-1");
			expect(found).not.toBe(job);
			expect(found).toEqual(job);
		});
	});

	describe("findNextEligible", () => {
		it("should return undefined when no jobs exist", async () => {
			const found = await repo.findNextEligible(["test"]);
			expect(found).toBeUndefined();
		});

		it("should return undefined when no jobs are eligible", async () => {
			await repo.create(
				createJob({
					id: "future-job",
					scheduledAt: new Date(Date.now() + 60000),
				}),
			);

			const found = await repo.findNextEligible(["test"]);
			expect(found).toBeUndefined();
		});

		it("should not return completed jobs", async () => {
			await repo.create(
				createJob({
					id: "completed-job",
					scheduledAt: new Date(Date.now() - 1000),
					completedAt: new Date(),
				}),
			);

			const found = await repo.findNextEligible(["test"]);
			expect(found).toBeUndefined();
		});

		it("should return the job with earliest scheduledAt", async () => {
			await repo.create(
				createJob({
					id: "later-job",
					scheduledAt: new Date(Date.now() - 100),
				}),
			);
			await repo.create(
				createJob({
					id: "earliest-job",
					scheduledAt: new Date(Date.now() - 1000),
				}),
			);

			const found = await repo.findNextEligible(["test"]);
			expect(found?.id).toBe("earliest-job");
		});

		it("should filter by queue", async () => {
			await repo.create(
				createJob({
					id: "queue-a-job",
					queue: "queue-a",
					scheduledAt: new Date(Date.now() - 1000),
				}),
			);
			await repo.create(
				createJob({
					id: "queue-b-job",
					queue: "queue-b",
					scheduledAt: new Date(Date.now() - 1000),
				}),
			);

			const found = await repo.findNextEligible(["queue-b"]);
			expect(found?.id).toBe("queue-b-job");
		});
	});

	describe("update", () => {
		it("should update an existing job", async () => {
			const job = createJob({ id: "job-1", attempts: 0 });
			await repo.create(job);

			const updated = await repo.update({ ...job, attempts: 1 });

			expect(updated.attempts).toBe(1);

			const found = await repo.findById("job-1");
			expect(found?.attempts).toBe(1);
		});

		it("should throw for non-existent job", async () => {
			const job = createJob({ id: "non-existent" });

			expect(repo.update(job)).rejects.toThrow("Job non-existent not found");
		});
	});

	describe("updateProgress", () => {
		it("should update job progress", async () => {
			const job = createJob({ id: "job-1" });
			await repo.create(job);

			const progressDate = new Date();
			await repo.updateProgress("job-1", { percent: 50 }, progressDate);

			const found = await repo.findById("job-1");
			expect(found?.progress).toEqual({ percent: 50 });
			expect(found?.progressUpdatedAt).toEqual(progressDate);
		});

		it("should throw for non-existent job", async () => {
			expect(repo.updateProgress("non-existent", {}, new Date())).rejects.toThrow("Job non-existent not found");
		});
	});

	describe("list", () => {
		it("should return all jobs", async () => {
			await repo.create(createJob({ id: "job-1", queue: "queue-a" }));
			await repo.create(createJob({ id: "job-2", queue: "queue-b" }));

			const all = await repo.list();
			expect(all.length).toBe(2);
		});

		it("should filter by queue", async () => {
			await repo.create(createJob({ id: "job-1", queue: "queue-a" }));
			await repo.create(createJob({ id: "job-2", queue: "queue-b" }));

			const filtered = await repo.list("queue-a");
			expect(filtered.length).toBe(1);
			expect(filtered[0]?.queue).toBe("queue-a");
		});
	});

	describe("listPending", () => {
		it("should return only pending jobs", async () => {
			await repo.create(createJob({ id: "pending-job" }));
			await repo.create(createJob({ id: "completed-job", completedAt: new Date() }));

			const pending = await repo.listPending();
			expect(pending.length).toBe(1);
			expect(pending[0]?.id).toBe("pending-job");
		});
	});

	describe("listCompleted", () => {
		it("should return only completed jobs", async () => {
			await repo.create(createJob({ id: "pending-job" }));
			await repo.create(createJob({ id: "completed-job", completedAt: new Date() }));

			const completed = await repo.listCompleted();
			expect(completed.length).toBe(1);
			expect(completed[0]?.id).toBe("completed-job");
		});
	});

	describe("clear", () => {
		it("should remove all jobs", async () => {
			await repo.create(createJob({ id: "job-1" }));
			await repo.create(createJob({ id: "job-2" }));

			repo.clear();

			const all = await repo.list();
			expect(all.length).toBe(0);
		});
	});
});

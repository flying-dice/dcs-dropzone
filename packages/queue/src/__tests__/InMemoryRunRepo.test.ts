import { beforeEach, describe, expect, it } from "bun:test";
import { InMemoryRunRepo } from "../adapters";
import type { Run } from "../index.ts";

describe("InMemoryRunRepo", () => {
	let repo: InMemoryRunRepo;

	beforeEach(() => {
		repo = new InMemoryRunRepo();
	});

	function createRun(overrides: Partial<Run> = {}): Run {
		return {
			id: crypto.randomUUID(),
			jobId: "job-1",
			attempt: 1,
			state: "running",
			startedAt: new Date(),
			...overrides,
		};
	}

	describe("create", () => {
		it("should create and return the run", async () => {
			const run = createRun({ id: "run-1" });
			const created = await repo.create(run);

			expect(created).toEqual(run);
		});

		it("should store the run retrievable by id", async () => {
			const run = createRun({ id: "run-1" });
			await repo.create(run);

			const found = await repo.findById("run-1");
			expect(found).toEqual(run);
		});
	});

	describe("findById", () => {
		it("should return undefined for non-existent run", async () => {
			const found = await repo.findById("non-existent");
			expect(found).toBeUndefined();
		});

		it("should return a copy of the run", async () => {
			const run = createRun({ id: "run-1" });
			await repo.create(run);

			const found = await repo.findById("run-1");
			expect(found).not.toBe(run);
			expect(found).toEqual(run);
		});
	});

	describe("update", () => {
		it("should update an existing run", async () => {
			const run = createRun({ id: "run-1", state: "running" });
			await repo.create(run);

			const updated = await repo.update({ ...run, state: "success" });

			expect(updated.state).toBe("success");

			const found = await repo.findById("run-1");
			expect(found?.state).toBe("success");
		});

		it("should throw for non-existent run", async () => {
			const run = createRun({ id: "non-existent" });

			expect(repo.update(run)).rejects.toThrow("Run non-existent not found");
		});
	});

	describe("findLatestByJobId", () => {
		it("should return undefined when no runs exist for job", async () => {
			const found = await repo.findLatestByJobId("job-1");
			expect(found).toBeUndefined();
		});

		it("should return the run with highest attempt number", async () => {
			await repo.create(createRun({ id: "run-1", jobId: "job-1", attempt: 1 }));
			await repo.create(createRun({ id: "run-2", jobId: "job-1", attempt: 3 }));
			await repo.create(createRun({ id: "run-3", jobId: "job-1", attempt: 2 }));

			const found = await repo.findLatestByJobId("job-1");
			expect(found?.id).toBe("run-2");
			expect(found?.attempt).toBe(3);
		});

		it("should only consider runs for the specified job", async () => {
			await repo.create(createRun({ id: "run-1", jobId: "job-1", attempt: 1 }));
			await repo.create(createRun({ id: "run-2", jobId: "job-2", attempt: 5 }));

			const found = await repo.findLatestByJobId("job-1");
			expect(found?.id).toBe("run-1");
		});
	});

	describe("listByJobId", () => {
		it("should return empty array when no runs exist for job", async () => {
			const runs = await repo.listByJobId("job-1");
			expect(runs).toEqual([]);
		});

		it("should return runs sorted by attempt", async () => {
			await repo.create(createRun({ id: "run-3", jobId: "job-1", attempt: 3 }));
			await repo.create(createRun({ id: "run-1", jobId: "job-1", attempt: 1 }));
			await repo.create(createRun({ id: "run-2", jobId: "job-1", attempt: 2 }));

			const runs = await repo.listByJobId("job-1");
			expect(runs.map((r) => r.attempt)).toEqual([1, 2, 3]);
		});

		it("should only return runs for the specified job", async () => {
			await repo.create(createRun({ id: "run-1", jobId: "job-1" }));
			await repo.create(createRun({ id: "run-2", jobId: "job-2" }));

			const runs = await repo.listByJobId("job-1");
			expect(runs.length).toBe(1);
			expect(runs[0]?.jobId).toBe("job-1");
		});
	});

	describe("listFailed", () => {
		it("should return empty array when no failed runs exist", async () => {
			await repo.create(createRun({ state: "success" }));
			await repo.create(createRun({ state: "running" }));

			const failed = await repo.listFailed();
			expect(failed).toEqual([]);
		});

		it("should return only failed runs", async () => {
			await repo.create(createRun({ id: "success-run", state: "success" }));
			await repo.create(createRun({ id: "failed-run-1", state: "failed", error: "Error 1" }));
			await repo.create(createRun({ id: "running-run", state: "running" }));
			await repo.create(createRun({ id: "failed-run-2", state: "failed", error: "Error 2" }));

			const failed = await repo.listFailed();
			expect(failed.length).toBe(2);
			expect(failed.map((r) => r.id).sort()).toEqual(["failed-run-1", "failed-run-2"]);
		});
	});

	describe("clear", () => {
		it("should remove all runs", async () => {
			await repo.create(createRun({ id: "run-1" }));
			await repo.create(createRun({ id: "run-2" }));

			repo.clear();

			const found = await repo.findById("run-1");
			expect(found).toBeUndefined();
		});
	});
});

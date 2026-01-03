import { beforeEach, describe, expect, it } from "bun:test";
import { InMemoryRunRepo } from "../adapters";
import { type Run, RunErrorCode, RunState } from "../types.ts";

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
			state: RunState.Running,
			startedAt: new Date(),
			...overrides,
		};
	}

	describe("save", () => {
		it("should save and retrieve a run by id", async () => {
			const run = createRun({ id: "run-1" });

			await repo.save(run);
			const found = await repo.findById("run-1");

			expect(found).toEqual(run);
		});

		it("should update an existing run", async () => {
			const run = createRun({ id: "run-1", state: RunState.Running });
			await repo.save(run);

			const updated = await repo.save({ ...run, state: RunState.Success });

			expect(updated.state).toBe(RunState.Success);
			const found = await repo.findById("run-1");
			expect(found?.state).toBe(RunState.Success);
		});
	});

	describe("findById", () => {
		it("should return undefined for non-existent run", async () => {
			const found = await repo.findById("non-existent");
			expect(found).toBeUndefined();
		});

		it("should return a copy of the run", async () => {
			const run = createRun({ id: "run-1" });
			await repo.save(run);

			const found = await repo.findById("run-1");
			found!.state = RunState.Failed;

			const foundAgain = await repo.findById("run-1");
			expect(foundAgain?.state).toBe(RunState.Running);
		});
	});

	describe("findLatestByJobId", () => {
		it("should return undefined when no runs exist for job", async () => {
			const found = await repo.findLatestByJobId("job-1");
			expect(found).toBeUndefined();
		});

		it("should return the latest run by startedAt", async () => {
			await repo.save(createRun({ id: "run-1", jobId: "job-1", startedAt: new Date(1000) }));
			await repo.save(createRun({ id: "run-2", jobId: "job-1", startedAt: new Date(3000) }));
			await repo.save(createRun({ id: "run-3", jobId: "job-1", startedAt: new Date(2000) }));

			const latest = await repo.findLatestByJobId("job-1");
			expect(latest?.id).toBe("run-2");
		});

		it("should only consider runs for the specified job", async () => {
			await repo.save(createRun({ id: "run-1", jobId: "job-1", startedAt: new Date(1000) }));
			await repo.save(createRun({ id: "run-2", jobId: "job-2", startedAt: new Date(3000) }));

			const latest = await repo.findLatestByJobId("job-1");
			expect(latest?.id).toBe("run-1");
		});
	});

	describe("listByJobId", () => {
		it("should return empty array when no runs exist for job", async () => {
			const runs = await repo.listByJobId("job-1");
			expect(runs).toEqual([]);
		});

		it("should return only runs for the specified job sorted by startedAt", async () => {
			await repo.save(createRun({ id: "run-1", jobId: "job-1", startedAt: new Date(2000) }));
			await repo.save(createRun({ id: "run-2", jobId: "job-2", startedAt: new Date(1000) }));
			await repo.save(createRun({ id: "run-3", jobId: "job-1", startedAt: new Date(1000) }));

			const runs = await repo.listByJobId("job-1");
			expect(runs.map((r) => r.id)).toEqual(["run-3", "run-1"]);
		});
	});

	describe("listFailed", () => {
		it("should return empty array when no failed runs exist", async () => {
			await repo.save(createRun({ state: RunState.Running }));
			await repo.save(createRun({ state: RunState.Success }));

			const failed = await repo.listFailed();
			expect(failed).toEqual([]);
		});

		it("should return only failed runs sorted by startedAt", async () => {
			await repo.save(
				createRun({
					id: "fail-2",
					state: RunState.Failed,
					startedAt: new Date(2000),
					error: { code: RunErrorCode.ProcessorError, message: "Error" },
				}),
			);
			await repo.save(createRun({ id: "success", state: RunState.Success }));
			await repo.save(
				createRun({
					id: "fail-1",
					state: RunState.Failed,
					startedAt: new Date(1000),
					error: { code: RunErrorCode.ProcessorError, message: "Error" },
				}),
			);

			const failed = await repo.listFailed();
			expect(failed.map((r) => r.id)).toEqual(["fail-1", "fail-2"]);
		});
	});

	describe("clear", () => {
		it("should remove all runs", async () => {
			await repo.save(createRun({ id: "run-1" }));
			await repo.save(createRun({ id: "run-2" }));

			repo.clear();

			expect(await repo.findById("run-1")).toBeUndefined();
			expect(await repo.findById("run-2")).toBeUndefined();
		});
	});
});

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

	describe("listRunning", () => {
		it("should return empty array when no running runs exist", async () => {
			await repo.save(createRun({ state: RunState.Success }));
			await repo.save(
				createRun({
					state: RunState.Failed,
					error: { code: RunErrorCode.ProcessorError, message: "Error" },
				}),
			);

			const running = await repo.listRunning();
			expect(running).toEqual([]);
		});

		it("should return only running runs", async () => {
			await repo.save(createRun({ id: "success-run", state: RunState.Success }));
			await repo.save(createRun({ id: "running-run-1", state: RunState.Running, startedAt: new Date(1000) }));
			await repo.save(
				createRun({
					id: "failed-run",
					state: RunState.Failed,
					error: { code: RunErrorCode.ProcessorError, message: "Error" },
				}),
			);
			await repo.save(createRun({ id: "running-run-2", state: RunState.Running, startedAt: new Date(2000) }));

			const running = await repo.listRunning();
			expect(running.length).toBe(2);
			expect(running.map((r) => r.id)).toEqual(["running-run-1", "running-run-2"]);
		});

		it("should return runs sorted by startedAt", async () => {
			await repo.save(createRun({ id: "run-3", state: RunState.Running, startedAt: new Date(3000) }));
			await repo.save(createRun({ id: "run-1", state: RunState.Running, startedAt: new Date(1000) }));
			await repo.save(createRun({ id: "run-2", state: RunState.Running, startedAt: new Date(2000) }));

			const running = await repo.listRunning();
			expect(running.map((r) => r.id)).toEqual(["run-1", "run-2", "run-3"]);
		});
	});

	describe("save (update existing)", () => {
		it("should update and return the modified run", async () => {
			const run = createRun({ id: "run-1", state: RunState.Running });
			await repo.save(run);

			const updated = await repo.save({ ...run, state: RunState.Success });

			expect(updated.state).toBe(RunState.Success);
			const found = await repo.findById("run-1");
			expect(found?.state).toBe(RunState.Success);
		});

		it("should create a new run if it does not exist", async () => {
			const run = createRun({ id: "new-run" });
			const saved = await repo.save(run);

			expect(saved).toEqual(run);
			const found = await repo.findById("new-run");
			expect(found).toEqual(run);
		});
	});

	describe("sorting by startedAt", () => {
		it("should sort listFailed by startedAt", async () => {
			await repo.save(
				createRun({
					id: "fail-3",
					state: RunState.Failed,
					startedAt: new Date(3000),
					error: { code: RunErrorCode.ProcessorError, message: "Error" },
				}),
			);
			await repo.save(
				createRun({
					id: "fail-1",
					state: RunState.Failed,
					startedAt: new Date(1000),
					error: { code: RunErrorCode.ProcessorError, message: "Error" },
				}),
			);

			const failed = await repo.listFailed();
			expect(failed.map((r) => r.id)).toEqual(["fail-1", "fail-3"]);
		});
	});
});

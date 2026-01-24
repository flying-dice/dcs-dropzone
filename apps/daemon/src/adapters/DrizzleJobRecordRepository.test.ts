import { beforeAll, describe, expect, it } from "bun:test";
import { JobErrorCode, type JobRecord, JobState } from "@packages/queue";
import { eq } from "drizzle-orm";
import Database from "../database";
import { T_JOBS } from "../database/schema.ts";
import { DrizzleJobRecordRepository } from "./DrizzleJobRecordRepository.ts";

describe("DrizzleJobRecordRepository", () => {
	describe("create", () => {
		it("should create a new record where no job id exists", () => {
			const { db } = Database(":memory:");
			const repo = new DrizzleJobRecordRepository({ db });

			repo.create({ processorName: "test-processor", jobData: { foo: "bar" }, initialState: JobState.Waiting });

			expect(db.select().from(T_JOBS).all()).toHaveLength(1);
			expect(db.select().from(T_JOBS).get()).toMatchObject({
				runId: expect.any(String),
				jobId: expect.any(String),
				processorName: "test-processor",
				jobData: { foo: "bar" },
				state: JobState.Waiting,
				createdAt: expect.any(Date),
				startedAt: null,
				finishedAt: null,
				progress: null,
				progressUpdatedAt: null,
				result: null,
				errorCode: null,
				errorMessage: null,
			});
		});
	});

	describe("findByRunId", () => {
		it("should find a record by its run ID", () => {
			const { db } = Database(":memory:");
			const repo = new DrizzleJobRecordRepository({ db });

			const createdRecord = repo.create({
				processorName: "test-processor",
				jobData: { foo: "bar" },
				initialState: JobState.Waiting,
			});

			const foundRecord = repo.findByRunId(createdRecord.runId);

			expect(foundRecord).toMatchObject({
				runId: createdRecord.runId,
				jobId: createdRecord.jobId,
				processorName: "test-processor",
				jobData: { foo: "bar" },
				state: JobState.Waiting,
				createdAt: expect.any(Date),
				startedAt: undefined,
				finishedAt: undefined,
				progress: undefined,
				progressUpdatedAt: undefined,
				result: undefined,
				errorCode: undefined,
				errorMessage: undefined,
			});
		});
	});

	describe("findAllByJobId", () => {
		it("should find all records by job ID", () => {
			const { db } = Database(":memory:");
			const repo = new DrizzleJobRecordRepository({ db });

			const createdRecord1 = repo.create({
				processorName: "test-processor",
				jobData: { foo: "bar" },
				initialState: JobState.Waiting,
			});
			const createdRecord2 = repo.create({
				processorName: "test-processor",
				jobData: { foo: "baz" },
				jobId: createdRecord1.jobId,
				initialState: JobState.Waiting,
			});

			const foundRecords = repo.findAllByJobId(createdRecord1.jobId);

			expect(foundRecords).toHaveLength(2);
			expect(foundRecords).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ runId: createdRecord1.runId, jobId: createdRecord1.jobId }),
					expect.objectContaining({ runId: createdRecord2.runId, jobId: createdRecord2.jobId }),
				]),
			);
		});
	});

	describe("findAllForProcessor", () => {
		it("should find all records for a specific processor", () => {
			const { db } = Database(":memory:");
			const repo = new DrizzleJobRecordRepository({ db });

			repo.create({ processorName: "processor1", jobData: {}, initialState: JobState.Waiting });
			repo.create({ processorName: "processor1", jobData: {}, initialState: JobState.Waiting });
			repo.create({ processorName: "processor2", jobData: {}, initialState: JobState.Waiting });

			const records = repo.findAllForProcessor("processor1");

			expect(records).toHaveLength(2);
			expect(records.every((record) => record.processorName === "processor1")).toBe(true);
		});
	});

	describe("findAllInState", () => {
		const { db } = Database(":memory:");
		const repo = new DrizzleJobRecordRepository({ db });

		let record1: JobRecord;
		let record2: JobRecord;
		let record3: JobRecord;

		beforeAll(() => {
			// Create test records
			record1 = repo.create({ processorName: "processor1", jobData: {}, initialState: JobState.Waiting });
			record2 = repo.create({ processorName: "processor1", jobData: {}, initialState: JobState.Waiting });
			record3 = repo.create({ processorName: "processor2", jobData: {}, initialState: JobState.Waiting });

			// Manually update states for testing
			db.update(T_JOBS).set({ state: JobState.Running }).where(eq(T_JOBS.runId, record1.runId)).run();
			db.update(T_JOBS).set({ state: JobState.Failed }).where(eq(T_JOBS.runId, record2.runId)).run();
			db.update(T_JOBS).set({ state: JobState.Success }).where(eq(T_JOBS.runId, record3.runId)).run();
		});

		it("should find all records in specific states", () => {
			const foundRecords = repo.findAllInState([JobState.Running, JobState.Failed], { processorName: "processor1" });

			expect(foundRecords).toHaveLength(2);
			expect(foundRecords).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ runId: record1.runId }),
					expect.objectContaining({ runId: record2.runId }),
				]),
			);
		});

		it("should limit the number of returned records", () => {
			const foundRecords = repo.findAllInState([JobState.Running, JobState.Failed, JobState.Success], { limit: 2 });
			expect(foundRecords).toHaveLength(2);
		});

		it("should filter by processor if provided", () => {
			const foundRecords = repo.findAllInState([JobState.Running, JobState.Failed, JobState.Success], {
				processorName: "processor2",
			});
			expect(foundRecords).toHaveLength(1);
			expect(foundRecords[0]?.processorName).toBe("processor2");
		});
	});

	describe("markFailedForRunId", () => {
		it("should mark a job record as failed", () => {
			const { db } = Database(":memory:");
			const repo = new DrizzleJobRecordRepository({ db });

			const createdRecord = repo.create({ processorName: "test", jobData: {}, initialState: JobState.Waiting });

			repo.markFailedForRunId(createdRecord.runId, JobErrorCode.ProcessorError, "Test error message");

			const updatedRecord = repo.findByRunId(createdRecord.runId);
			expect(updatedRecord).toMatchObject({
				runId: createdRecord.runId,
				jobId: createdRecord.jobId,
				processorName: "test",
				jobData: {},
				state: JobState.Failed,
				createdAt: expect.any(Date),
				startedAt: undefined,
				finishedAt: expect.any(Date),
				progress: undefined,
				progressUpdatedAt: undefined,
				result: undefined,
				errorCode: JobErrorCode.ProcessorError,
				errorMessage: "Test error message",
			});
		});
	});

	describe("markRunningForRunId", () => {
		it("should mark a job record as running", () => {
			const { db } = Database(":memory:");
			const repo = new DrizzleJobRecordRepository({ db });

			const createdRecord = repo.create({ processorName: "test", jobData: {}, initialState: JobState.Waiting });

			repo.markRunningForRunId(createdRecord.runId);

			const updatedRecord = repo.findByRunId(createdRecord.runId);
			expect(updatedRecord).toMatchObject({
				runId: createdRecord.runId,
				jobId: createdRecord.jobId,
				processorName: "test",
				jobData: {},
				state: JobState.Running,
				createdAt: expect.any(Date),
				startedAt: expect.any(Date),
				finishedAt: undefined,
				progress: undefined,
				progressUpdatedAt: undefined,
				result: undefined,
				errorCode: undefined,
				errorMessage: undefined,
			});
		});
	});

	describe("markSuccessForRunId", () => {
		it("should mark a job record as success", () => {
			const { db } = Database(":memory:");
			const repo = new DrizzleJobRecordRepository({ db });

			const createdRecord = repo.create({ processorName: "test", jobData: {}, initialState: JobState.Waiting });

			repo.markSuccessForRunId(createdRecord.runId, "result");

			const updatedRecord = repo.findByRunId(createdRecord.runId);
			expect(updatedRecord).toMatchObject({
				runId: createdRecord.runId,
				jobId: createdRecord.jobId,
				processorName: "test",
				jobData: {},
				state: JobState.Success,
				createdAt: expect.any(Date),
				startedAt: undefined,
				finishedAt: expect.any(Date),
				progress: undefined,
				progressUpdatedAt: undefined,
				result: "result",
				errorCode: undefined,
				errorMessage: undefined,
			});
		});
	});

	describe("updateProgressForRunId", () => {
		it("should update progress for a job record", () => {
			const { db } = Database(":memory:");
			const repo = new DrizzleJobRecordRepository({ db });

			const createdRecord = repo.create({ processorName: "test", jobData: {}, initialState: JobState.Waiting });

			repo.updateProgressForRunId(createdRecord.runId, 50);

			const updatedRecord = repo.findByRunId(createdRecord.runId);
			expect(updatedRecord).toMatchObject({
				runId: createdRecord.runId,
				jobId: createdRecord.jobId,
				processorName: "test",
				jobData: {},
				state: JobState.Waiting,
				createdAt: expect.any(Date),
				startedAt: undefined,
				finishedAt: undefined,
				progress: 50,
				progressUpdatedAt: expect.any(Date),
				result: undefined,
				errorCode: undefined,
				errorMessage: undefined,
			});
		});
	});
});

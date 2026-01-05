import { describe, expect, it } from "bun:test";
import * as assert from "node:assert";
import { InMemoryJobRecordRepository } from "./InMemoryJobRecordRepository.ts";
import { JobErrorCode, JobState } from "./JobRecordRepository.ts";

describe("InMemoryJobRecordRepository", () => {
	it("saves a new job record", () => {
		const repository = new InMemoryJobRecordRepository();

		const savedRecord = repository.create({
			processorName: "test",
			jobData: {},
		});

		expect(savedRecord).toMatchObject({
			processorName: "test",
			jobData: {},
			state: JobState.Pending,
			createdAt: expect.any(Date),
		});
	});

	it("finds all job records for a specific processor", () => {
		const repository = new InMemoryJobRecordRepository();
		repository.create({ processorName: "processor1", jobData: {} });
		repository.create({ processorName: "processor1", jobData: {} });
		repository.create({ processorName: "processor2", jobData: {} });

		const records = repository.findAllForProcessor("processor1");

		expect(records).toHaveLength(2);
		expect(records.every((record) => record.processorName === "processor1")).toBe(true);
	});

	it("marks a job record as completed", () => {
		const repository = new InMemoryJobRecordRepository();
		const record = repository.create({ processorName: "test", jobData: {} });

		repository.markSuccessForRunId(record.runId, "result");

		const updatedRecord = repository.findByRunId(record.runId);
		expect(updatedRecord?.state).toBe(JobState.Success);
		expect(updatedRecord?.finishedAt).toBeInstanceOf(Date);
	});

	it("should mark a job record as running", () => {
		const repository = new InMemoryJobRecordRepository();
		const record = repository.create({ processorName: "test", jobData: {} });

		repository.markRunningForRunId(record.runId);

		const updatedRecord = repository.findByRunId(record.runId);
		expect(updatedRecord?.state).toBe(JobState.Running);
		expect(updatedRecord?.startedAt).toBeInstanceOf(Date);
	});

	it("should mark a job record as failed", () => {
		const repository = new InMemoryJobRecordRepository();
		const record = repository.create({ processorName: "test", jobData: {} });

		repository.markFailedForRunId(record.runId, JobErrorCode.ProcessorError, "Test error message");

		const updatedRecord = repository.findByRunId(record.runId);
		expect(updatedRecord?.state).toBe(JobState.Failed);
		expect(updatedRecord?.finishedAt).toBeInstanceOf(Date);
		expect(updatedRecord?.errorCode).toBe(JobErrorCode.ProcessorError);
		expect(updatedRecord?.errorMessage).toBe("Test error message");
	});

	it("should find by job Id", () => {
		const repository = new InMemoryJobRecordRepository();
		const record1 = repository.create({ processorName: "test", jobData: {} });
		const _record2 = repository.create({ processorName: "test", jobData: {} });
		const records = repository.findAllByJobId(record1.jobId);
		expect(records).toBeDefined();

		assert.ok(records);

		expect(records.length).toBe(1);

		const [record] = records;
		assert.ok(record);

		expect(record.runId).toBe(record1.runId);
	});

	it("updates progress for a job record", () => {
		const repository = new InMemoryJobRecordRepository();
		const record = repository.create({ processorName: "test", jobData: {} });

		repository.updateProgressForRunId(record.runId, 50);

		const updatedRecord = repository.findByRunId(record.runId);
		expect(updatedRecord?.progress).toBe(50);
		expect(updatedRecord?.progressUpdatedAt).toBeInstanceOf(Date);
	});

	it("returns an empty array when no records match the processor name", () => {
		const repository = new InMemoryJobRecordRepository();
		repository.create({ processorName: "processor1", jobData: {} });

		const records = repository.findAllForProcessor("processor2");

		expect(records).toHaveLength(0);
	});

	it("should find by external reference ID", () => {
		const repository = new InMemoryJobRecordRepository();
		const record1 = repository.create({ processorName: "test", jobData: {}, externalReferenceId: "ext-ref-1" });
		const _record2 = repository.create({ processorName: "test", jobData: {}, externalReferenceId: "ext-ref-2" });
		const records = repository.findAllByExternalReferenceId("ext-ref-1");
		expect(records).toBeDefined();
		assert.ok(records);

		expect(records.length).toBe(1);

		const [record] = records;
		assert.ok(record);

		expect(record.runId).toBe(record1.runId);
	});
});

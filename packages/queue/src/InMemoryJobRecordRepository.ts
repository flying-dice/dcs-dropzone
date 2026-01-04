import * as assert from "node:assert";
import {
	type CreateJobRecord,
	type JobErrorCode,
	type JobRecord,
	type JobRecordRepository,
	JobState,
} from "./JobRecordRepository.ts";

export class InMemoryJobRecordRepository implements JobRecordRepository {
	private jobRecords: JobRecord[] = [];

	create(record: CreateJobRecord): JobRecord {
		const newRecord: JobRecord = {
			runId: crypto.randomUUID(),
			jobId: record.jobId || crypto.randomUUID(),
			processorName: record.processorName,
			jobData: record.jobData,
			state: JobState.Pending,
			createdAt: new Date(),
		};

		this.jobRecords.push(newRecord);

		return newRecord;
	}

	/**
	 * Saves the given JobRecord directly into the in-memory store.
	 * @deprecated Do not use outside of tests.
	 */
	__rawSave(record: JobRecord): void {
		const index = this.jobRecords.findIndex((r) => r.runId === record.runId);
		if (index !== -1) {
			this.jobRecords[index] = record;
		} else {
			this.jobRecords.push(record);
		}
	}

	findByRunId(runId: string): JobRecord | undefined {
		return this.jobRecords.find((record) => record.runId === runId);
	}

	findAllByJobId(jobId: string): JobRecord[] {
		return Array.from(this.jobRecords.values()).filter((record) => record.jobId === jobId);
	}

	findAllForProcessor(processorName: string): JobRecord[] {
		return this.jobRecords.filter((record) => record.processorName === processorName);
	}

	findAllInState(state: JobState[], opts?: { limit?: number; processorName?: string }): JobRecord[] {
		return this.filterJobRecordsByState(state)
			.filter((record) => !opts?.processorName || record.processorName === opts.processorName)
			.slice(0, opts?.limit);
	}

	updateProgressForRunId(runId: string, progress: number): void {
		const record = this.findByRunId(runId);
		assert.ok(record, `JobRecord with runId ${runId} not found`);
		record.progress = progress;
		record.progressUpdatedAt = new Date();
	}

	markSuccessForRunId(runId: string, result: any): void {
		const record = this.findByRunId(runId);
		assert.ok(record, `JobRecord with runId ${runId} not found`);
		record.finishedAt = new Date();
		record.state = JobState.Success;
		record.result = result;
	}

	markRunningForRunId(runId: string) {
		const record = this.findByRunId(runId);
		assert.ok(record, `JobRecord with runId ${runId} not found`);
		record.startedAt = new Date();
		record.state = JobState.Running;
	}

	markFailedForRunId(runId: string, errorCode: JobErrorCode, errorMessage: string) {
		const record = this.findByRunId(runId);
		assert.ok(record, `JobRecord with runId ${runId} not found`);
		record.finishedAt = new Date();
		record.state = JobState.Failed;
		record.errorCode = errorCode;
		record.errorMessage = errorMessage;
	}

	private filterJobRecordsByState(state: JobState[], filter?: (record: JobRecord) => boolean): JobRecord[] {
		return this.jobRecords.filter((record) => state.includes(record.state) && (filter ? filter(record) : true));
	}
}

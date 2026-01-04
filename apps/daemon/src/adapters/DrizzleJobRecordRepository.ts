import * as crypto from "node:crypto";
import {
	type CreateJobRecord,
	type JobErrorCode,
	type JobRecord,
	type JobRecordRepository,
	JobState,
} from "@packages/queue";
import { and, eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { inArray } from "drizzle-orm/sql/expressions/conditions";
import { T_JOBS } from "../database/schema.ts";

function mapRowToJobRecord(row: typeof T_JOBS.$inferSelect): JobRecord {
	return {
		runId: row.runId,
		jobId: row.jobId,
		processorName: row.processorName,
		jobData: row.jobData,
		state: row.state,
		createdAt: row.createdAt,
		startedAt: row.startedAt ?? undefined,
		finishedAt: row.finishedAt ?? undefined,
		progress: row.progress ?? undefined,
		progressUpdatedAt: row.progressUpdatedAt ?? undefined,
		result: row.result !== null ? row.result : undefined,
		errorCode: row.errorCode ?? undefined,
		errorMessage: row.errorMessage ?? undefined,
	};
}

export class DrizzleJobRecordRepository implements JobRecordRepository {
	protected readonly db: BunSQLiteDatabase;

	constructor(deps: { db: BunSQLiteDatabase }) {
		this.db = deps.db;
	}

	create(record: CreateJobRecord): JobRecord {
		const data: typeof T_JOBS.$inferInsert = {
			runId: crypto.randomUUID(),
			jobId: record.jobId || crypto.randomUUID(),
			processorName: record.processorName,
			jobData: record.jobData,
			state: JobState.Pending,
			createdAt: new Date(),
		};

		return mapRowToJobRecord(this.db.insert(T_JOBS).values(data).returning().get());
	}

	findByRunId(runId: string): JobRecord | undefined {
		const row = this.db.select().from(T_JOBS).where(eq(T_JOBS.runId, runId)).get();
		return row ? mapRowToJobRecord(row) : undefined;
	}

	findAllByJobId(jobId: string): JobRecord[] {
		const rows = this.db.select().from(T_JOBS).where(eq(T_JOBS.jobId, jobId)).all();
		return rows.map(mapRowToJobRecord);
	}

	findAllForProcessor(processorName: string): JobRecord[] {
		const rows = this.db.select().from(T_JOBS).where(eq(T_JOBS.processorName, processorName)).all();
		return rows.map(mapRowToJobRecord);
	}

	findAllInState(state: JobState[], opts?: { limit?: number; processorName?: string }): JobRecord[] {
		const conditions = [inArray(T_JOBS.state, state)];
		if (opts?.processorName) {
			conditions.push(eq(T_JOBS.processorName, opts.processorName));
		}

		const query = this.db
			.select()
			.from(T_JOBS)
			.where(and(...conditions));

		if (opts?.limit) {
			query.limit(opts.limit);
		}

		const rows = query.all();

		return rows.map(mapRowToJobRecord);
	}

	markFailedForRunId(runId: string, errorCode: JobErrorCode, errorMessage: string): void {
		this.db
			.update(T_JOBS)
			.set({
				state: JobState.Failed,
				finishedAt: new Date(),
				errorCode: errorCode,
				errorMessage: errorMessage,
			})
			.where(eq(T_JOBS.runId, runId))
			.run();
	}

	markRunningForRunId(runId: string): void {
		this.db
			.update(T_JOBS)
			.set({
				state: JobState.Running,
				startedAt: new Date(),
			})
			.where(eq(T_JOBS.runId, runId))
			.run();
	}

	markSuccessForRunId(runId: string, result: any): void {
		this.db
			.update(T_JOBS)
			.set({
				state: JobState.Success,
				finishedAt: new Date(),
				result: result,
			})
			.where(eq(T_JOBS.runId, runId))
			.run();
	}

	updateProgressForRunId(runId: string, progress: number): void {
		this.db
			.update(T_JOBS)
			.set({
				progress: progress,
				progressUpdatedAt: new Date(),
			})
			.where(eq(T_JOBS.runId, runId))
			.run();
	}
}

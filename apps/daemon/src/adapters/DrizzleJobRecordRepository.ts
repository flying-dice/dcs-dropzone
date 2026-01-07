import * as crypto from "node:crypto";
import { Log } from "@packages/decorators";
import {
	type CreateJobRecord,
	type JobErrorCode,
	type JobRecord,
	type JobRecordRepository,
	JobState,
} from "@packages/queue";
import { and, desc, eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { inArray } from "drizzle-orm/sql/expressions/conditions";
import { getLogger } from "log4js";
import { T_JOBS } from "../database/schema.ts";

const logger = getLogger("DrizzleJobRecordRepository");

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

	@Log(logger)
	create(record: CreateJobRecord): JobRecord {
		const data: typeof T_JOBS.$inferInsert = {
			runId: crypto.randomUUID(),
			jobId: record.jobId || crypto.randomUUID(),
			processorName: record.processorName,
			jobData: record.jobData,
			state: record.initialState,
			createdAt: new Date(),
		};

		return mapRowToJobRecord(this.db.insert(T_JOBS).values(data).returning().get());
	}

	@Log(logger)
	findByRunId(runId: string): JobRecord | undefined {
		const row = this.db.select().from(T_JOBS).where(eq(T_JOBS.runId, runId)).get();
		return row ? mapRowToJobRecord(row) : undefined;
	}

	@Log(logger)
	findAllByJobId(jobId: string): JobRecord[] {
		const rows = this.db.select().from(T_JOBS).where(eq(T_JOBS.jobId, jobId)).all();
		return rows.map(mapRowToJobRecord);
	}

	@Log(logger)
	findLatestByJobId(jobId: string): JobRecord | undefined {
		const row = this.db.select().from(T_JOBS).where(eq(T_JOBS.jobId, jobId)).orderBy(desc(T_JOBS.createdAt)).get();

		return row ? mapRowToJobRecord(row) : undefined;
	}

	@Log(logger)
	findAllForProcessor(processorName: string): JobRecord[] {
		const rows = this.db.select().from(T_JOBS).where(eq(T_JOBS.processorName, processorName)).all();
		return rows.map(mapRowToJobRecord);
	}

	@Log(logger)
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

	@Log(logger)
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

	@Log(logger)
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

	@Log(logger)
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

	@Log(logger)
	markCancelledForRunId(runId: string) {
		this.db
			.update(T_JOBS)
			.set({
				state: JobState.Cancelled,
			})
			.where(eq(T_JOBS.runId, runId))
			.run();
	}

	@Log(logger)
	markWaitingForRunId(runId: string) {
		this.db
			.update(T_JOBS)
			.set({
				state: JobState.Waiting,
			})
			.where(eq(T_JOBS.runId, runId))
			.run();
	}

	@Log(logger)
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

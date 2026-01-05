export enum JobState {
	Pending = "pending",
	Waiting = "waiting",
	Running = "running",
	Success = "success",
	Failed = "failed",
	Cancelled = "cancelled",
}

export enum JobErrorCode {
	ProcessorError = "PROCESSOR_ERROR",
	ProcessorException = "PROCESSOR_EXCEPTION",
	JobRunNotFound = "JOB_RUN_NOT_FOUND",
}

export type JobRecord<TData = any, TResult = any> = {
	jobId: string;
	runId: string;
	processorName: string;
	jobData: TData;
	state: JobState;
	createdAt: Date;
	startedAt?: Date;
	finishedAt?: Date;
	progress?: number;
	progressUpdatedAt?: Date;
	result?: TResult;
	errorCode?: JobErrorCode;
	errorMessage?: string;
};

export type JobRecordDateFields = keyof Pick<JobRecord, "createdAt" | "startedAt" | "finishedAt" | "progressUpdatedAt">;

export type CreateJobRecord = {
	jobId?: JobRecord["jobId"];
	jobData: JobRecord["jobData"];
	processorName: JobRecord["processorName"];
	initialState: JobState.Waiting | JobState.Pending;
};

export interface JobRecordRepository {
	// -- Create --
	create(record: CreateJobRecord): JobRecord;

	// -- Read --
	findByRunId(runId: string): JobRecord | undefined;
	findAllByJobId(jobId: string): JobRecord[];
	findLatestByJobId(jobId: string): JobRecord | undefined;
	findAllForProcessor(processorName: string): JobRecord[];

	findAllInState(state: JobState[], opts?: { limit?: number; processorName?: string }): JobRecord[];

	// -- Update --
	updateProgressForRunId(runId: string, progress: number): void;
	markSuccessForRunId(runId: string, result: any): void;
	markRunningForRunId(runId: string): void;
	markFailedForRunId(runId: string, errorCode: JobErrorCode, errorMessage: string): void;
	markCancelledForRunId(runId: string): void;
	markWaitingForRunId(runId: string): void;
}

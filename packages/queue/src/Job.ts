/**
 * Represents a unit of work intent.
 * Jobs never fail - they are completed only on successful execution.
 */
export type Job<TData = unknown, TProgress = unknown> = {
	id: string;
	queue: string;
	name: string;
	data: TData;
	createdAt: Date;
	scheduledAt: Date;
	completedAt?: Date;
	attempts: number;
	progress?: TProgress;
	progressUpdatedAt?: Date;
};

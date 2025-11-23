import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Download Queue Job Status
 * Represents the lifecycle states of a download job
 */
export enum DownloadJobStatus {
	PENDING = "PENDING",
	PROCESSING = "PROCESSING",
	COMPLETED = "COMPLETED",
	FAILED = "FAILED",
	RETRYING = "RETRYING",
}

/**
 * Download Queue Table
 * Single source of truth for download job state
 */
export const T_DOWNLOAD_QUEUE = sqliteTable("DOWNLOAD_QUEUE", {
	// Identity & Location
	id: text("id").primaryKey(),
	url: text("url").notNull(),
	targetDirectory: text("target_directory").notNull(),
	filename: text("filename"), // Actual filename (may differ from URL due to content-disposition)

	// State Management
	status: text("status")
		.notNull()
		.$type<DownloadJobStatus>()
		.default(DownloadJobStatus.PENDING),

	// Progress Tracking
	progressPercent: int("progress_percent").default(0),
	progressSummary: text("progress_summary"),

	// Retry Metadata
	retryCount: int("retry_count").notNull().default(0),
	maxRetries: int("max_retries").notNull().default(3),
	nextRetryAt: int("next_retry_at"), // Unix timestamp in milliseconds

	// Process Management
	pid: int("pid"), // Process ID when job is running

	// Audit
	createdAt: int("created_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: int("updated_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type DownloadQueueJob = typeof T_DOWNLOAD_QUEUE.$inferSelect;
export type NewDownloadQueueJob = typeof T_DOWNLOAD_QUEUE.$inferInsert;

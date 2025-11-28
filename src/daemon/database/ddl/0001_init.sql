CREATE TABLE `EXTRACT_DOWNLOAD_JOIN` (
	`id` text PRIMARY KEY NOT NULL,
	`extract_job_id` text NOT NULL,
	`download_job_id` text NOT NULL,
	FOREIGN KEY (`extract_job_id`) REFERENCES `EXTRACT_QUEUE`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`download_job_id`) REFERENCES `DOWNLOAD_QUEUE`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `EXTRACT_QUEUE` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`release_asset_id` text NOT NULL,
	`archive_path` text NOT NULL,
	`target_directory` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`progress_percent` integer DEFAULT 0 NOT NULL,
	`attempt` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`next_attempt_after` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `MOD_RELEASES`(`release_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`release_asset_id`) REFERENCES `MOD_RELEASE_ASSETS`(`id`) ON UPDATE no action ON DELETE no action
);

PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_EXTRACT_DOWNLOAD_JOIN` (
	`id` text PRIMARY KEY NOT NULL,
	`extract_job_id` text NOT NULL,
	`download_job_id` text NOT NULL,
	FOREIGN KEY (`extract_job_id`) REFERENCES `EXTRACT_QUEUE`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`download_job_id`) REFERENCES `DOWNLOAD_QUEUE`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_EXTRACT_DOWNLOAD_JOIN`("id", "extract_job_id", "download_job_id") SELECT "id", "extract_job_id", "download_job_id" FROM `EXTRACT_DOWNLOAD_JOIN`;--> statement-breakpoint
DROP TABLE `EXTRACT_DOWNLOAD_JOIN`;--> statement-breakpoint
ALTER TABLE `__new_EXTRACT_DOWNLOAD_JOIN` RENAME TO `EXTRACT_DOWNLOAD_JOIN`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
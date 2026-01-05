CREATE TABLE `APP_ATTRIBUTES` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `JOBS` (
	`run_id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`processor_name` text NOT NULL,
	`job_data` text NOT NULL,
	`state` text NOT NULL,
	`created_at` integer NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`progress` integer,
	`progress_updated_at` integer,
	`result` text,
	`error_code` text,
	`error_message` text,
	`external_reference_id` text
);
--> statement-breakpoint
CREATE TABLE `JOBS_FOR_RELEASE` (
	`release_id` text NOT NULL,
	`job_id` text NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `MOD_RELEASES`(`release_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `JOBS`(`job_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `MOD_RELEASES` (
	`release_id` text PRIMARY KEY NOT NULL,
	`mod_id` text NOT NULL,
	`mod_name` text NOT NULL,
	`version` text NOT NULL,
	`version_hash` text NOT NULL,
	`dependencies` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `MOD_RELEASE_ASSETS` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`name` text NOT NULL,
	`is_archive` integer NOT NULL,
	`urls` text NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `MOD_RELEASES`(`release_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `MOD_RELEASE_MISSION_SCRIPTS` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`name` text NOT NULL,
	`purpose` text NOT NULL,
	`path` text NOT NULL,
	`root` text NOT NULL,
	`run_on` text NOT NULL,
	`installed_path` text,
	FOREIGN KEY (`release_id`) REFERENCES `MOD_RELEASES`(`release_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `MOD_RELEASE_SYMBOLIC_LINKS` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`name` text NOT NULL,
	`src` text NOT NULL,
	`dest` text NOT NULL,
	`dest_root` text NOT NULL,
	`installed_path` text,
	FOREIGN KEY (`release_id`) REFERENCES `MOD_RELEASES`(`release_id`) ON UPDATE no action ON DELETE no action
);

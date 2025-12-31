CREATE TABLE `APP_ATTRIBUTES` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `DOWNLOAD_QUEUE` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`release_asset_id` text NOT NULL,
	`url_id` text NOT NULL,
	`url` text NOT NULL,
	`target_directory` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`progress_percent` integer DEFAULT 0 NOT NULL,
	`attempt` integer DEFAULT 0 NOT NULL,
	`next_attempt_after` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `MOD_RELEASES`(`release_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`release_asset_id`) REFERENCES `MOD_RELEASE_ASSETS`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `EXTRACT_DOWNLOAD_JOIN` (
	`id` text PRIMARY KEY NOT NULL,
	`extract_job_id` text NOT NULL,
	`download_job_id` text NOT NULL,
	FOREIGN KEY (`extract_job_id`) REFERENCES `EXTRACT_QUEUE`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`download_job_id`) REFERENCES `DOWNLOAD_QUEUE`(`id`) ON UPDATE no action ON DELETE cascade
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
	`next_attempt_after` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `MOD_RELEASES`(`release_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`release_asset_id`) REFERENCES `MOD_RELEASE_ASSETS`(`id`) ON UPDATE no action ON DELETE no action
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

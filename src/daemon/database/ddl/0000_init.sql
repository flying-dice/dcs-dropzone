CREATE TABLE `MOD_RELEASES` (
	`release_id` text PRIMARY KEY NOT NULL,
	`mod_id` text NOT NULL,
	`mod_name` text NOT NULL,
	`version` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `MOD_RELEASE_ASSETS` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`name` text NOT NULL,
	`is_archive` integer NOT NULL,
	`dest_root` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL
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
	`installed_path` text
);
--> statement-breakpoint
CREATE TABLE `MOD_RELEASE_SYMBOLIC_LINKS` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL,
	`name` text NOT NULL,
	`src` text NOT NULL,
	`dest` text NOT NULL,
	`dest_root` text NOT NULL,
	`installed_path` text
);

import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
	DownloadJobStatus,
	ExtractJobStatus,
	type MissionScriptRunOn,
	type SymbolicLinkDestRoot,
} from "../../common/data.ts";

export const T_MOD_RELEASES = sqliteTable("MOD_RELEASES", {
	releaseId: text("release_id").primaryKey(),
	modId: text("mod_id").notNull(),
	modName: text("mod_name").notNull(),
	version: text("version").notNull(),
	dependencies: text("dependencies", { mode: "json" }).$type<string[]>().notNull(),
});

export const T_MOD_RELEASE_ASSETS = sqliteTable("MOD_RELEASE_ASSETS", {
	id: text("id").primaryKey(),
	releaseId: text("release_id")
		.notNull()
		.references(() => T_MOD_RELEASES.releaseId),
	name: text("name").notNull(),
	isArchive: int("is_archive", { mode: "boolean" }).notNull(),
	urls: text("urls", { mode: "json" }).$type<string[]>().notNull(),
});

export const T_MOD_RELEASE_SYMBOLIC_LINKS = sqliteTable("MOD_RELEASE_SYMBOLIC_LINKS", {
	id: text("id").primaryKey(),
	releaseId: text("release_id")
		.notNull()
		.references(() => T_MOD_RELEASES.releaseId),
	name: text("name").notNull(),
	src: text("src").notNull(),
	dest: text("dest").notNull(),
	destRoot: text("dest_root").$type<SymbolicLinkDestRoot>().notNull(),
	installedPath: text("installed_path"),
});

export const T_MOD_RELEASE_MISSION_SCRIPTS = sqliteTable("MOD_RELEASE_MISSION_SCRIPTS", {
	id: text("id").primaryKey(),
	releaseId: text("release_id")
		.notNull()
		.references(() => T_MOD_RELEASES.releaseId),
	name: text("name").notNull(),
	purpose: text("purpose").notNull(),
	path: text("path").notNull(),
	root: text("root").$type<SymbolicLinkDestRoot>().notNull(),
	runOn: text("run_on").$type<MissionScriptRunOn>().notNull(),
	installedPath: text("installed_path"),
});

export const T_DOWNLOAD_QUEUE = sqliteTable("DOWNLOAD_QUEUE", {
	id: text("id").primaryKey(),
	releaseId: text("release_id")
		.notNull()
		.references(() => T_MOD_RELEASES.releaseId),
	releaseAssetId: text("release_asset_id")
		.notNull()
		.references(() => T_MOD_RELEASE_ASSETS.id),
	url: text("url").notNull(),
	targetDirectory: text("target_directory").notNull(),
	status: text("status").notNull().$type<DownloadJobStatus>().default(DownloadJobStatus.PENDING),
	progressPercent: int("progress_percent").notNull().default(0),
	attempt: int("attempt").notNull().default(0),
	maxAttempts: int("max_attempts").notNull().default(3),
	nextAttemptAfter: int("next_attempt_after", { mode: "timestamp" }).notNull(),
	createdAt: int("created_at", { mode: "timestamp" }).notNull(),
});

export const T_EXTRACT_QUEUE = sqliteTable("EXTRACT_QUEUE", {
	id: text("id").primaryKey(),
	releaseId: text("release_id")
		.notNull()
		.references(() => T_MOD_RELEASES.releaseId),
	releaseAssetId: text("release_asset_id")
		.notNull()
		.references(() => T_MOD_RELEASE_ASSETS.id),
	archivePath: text("archive_path").notNull(),
	targetDirectory: text("target_directory").notNull(),
	status: text("status").notNull().$type<ExtractJobStatus>().default(ExtractJobStatus.PENDING),
	progressPercent: int("progress_percent").notNull().default(0),
	attempt: int("attempt").notNull().default(0),
	maxAttempts: int("max_attempts").notNull().default(3),
	nextAttemptAfter: int("next_attempt_after", { mode: "timestamp" }).notNull(),
	createdAt: int("created_at", { mode: "timestamp" }).notNull(),
});

export const T_EXTRACT_DOWNLOAD_JOIN = sqliteTable("EXTRACT_DOWNLOAD_JOIN", {
	id: text("id").primaryKey(),
	extractJobId: text("extract_job_id")
		.notNull()
		.references(() => T_EXTRACT_QUEUE.id, { onDelete: "cascade" }),
	downloadJobId: text("download_job_id")
		.notNull()
		.references(() => T_DOWNLOAD_QUEUE.id, { onDelete: "cascade" }),
});

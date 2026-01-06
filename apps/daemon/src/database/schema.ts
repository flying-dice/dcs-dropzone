import type { JobErrorCode, JobState } from "@packages/queue";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";

export const T_APP_ATTRIBUTES = sqliteTable("APP_ATTRIBUTES", {
	key: text("key").primaryKey(),
	value: text("value", { mode: "json" }).$type<any>().notNull(),
});

export const T_MOD_RELEASES = sqliteTable("MOD_RELEASES", {
	releaseId: text("release_id").primaryKey(),
	modId: text("mod_id").notNull(),
	modName: text("mod_name").notNull(),
	version: text("version").notNull(),
	versionHash: text("version_hash").notNull(),
	dependencies: text("dependencies", { mode: "json" }).$type<string[]>().notNull(),
});

export const T_MOD_RELEASE_ASSETS = sqliteTable("MOD_RELEASE_ASSETS", {
	id: text("id").primaryKey(),
	releaseId: text("release_id")
		.notNull()
		.references(() => T_MOD_RELEASES.releaseId),
	name: text("name").notNull(),
	isArchive: int("is_archive", { mode: "boolean" }).notNull(),
	urls: text("urls", { mode: "json" }).$type<{ id: string; url: string }[]>().notNull(),
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

export const T_JOBS = sqliteTable("JOBS", {
	runId: text("run_id").primaryKey(),
	jobId: text("job_id").notNull(),
	processorName: text("processor_name").notNull(),
	jobData: text("job_data", { mode: "json" }).$type<any>().notNull(),
	state: text("state").$type<JobState>().notNull(),
	createdAt: int("created_at", { mode: "timestamp" }).notNull(),
	startedAt: int("started_at", { mode: "timestamp" }),
	finishedAt: int("finished_at", { mode: "timestamp" }),
	progress: int("progress"),
	progressUpdatedAt: int("progress_updated_at", { mode: "timestamp" }),
	result: text("result", { mode: "json" }).$type<any>(),
	errorCode: text("error_code").$type<JobErrorCode>(),
	errorMessage: text("error_message"),
	externalReferenceId: text("external_reference_id"),
});

export const T_JOBS_FOR_RELEASE = sqliteTable("JOBS_FOR_RELEASE", {
	releaseId: text("release_id")
		.notNull()
		.references(() => T_MOD_RELEASES.releaseId),
	jobId: text("job_id")
		.notNull()
		.references(() => T_JOBS.jobId),
});

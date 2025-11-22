import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
	AssetStatus,
	type MissionScriptRunOn,
	type SymbolicLinkDestRoot,
} from "../../common/data.ts";

export const T_MOD_RELEASES = sqliteTable("MOD_RELEASES", {
	releaseId: text("release_id").primaryKey(),
	modId: text("mod_id").notNull(),
	modName: text("mod_name").notNull(),
	version: text("version").notNull(),
});

export const T_MOD_RELEASE_ASSETS = sqliteTable("MOD_RELEASE_ASSETS", {
	id: text("id").primaryKey(),
	releaseId: text("release_id").notNull(),
	name: text("name").notNull(),
	isArchive: int("is_archive", { mode: "boolean" }).notNull(),
	urls: text("dest_root", { mode: "json" }).$type<string[]>().notNull(),
	status: text("status")
		.notNull()
		.$type<AssetStatus>()
		.default(AssetStatus.PENDING),
});

export const T_MOD_RELEASE_SYMBOLIC_LINKS = sqliteTable(
	"MOD_RELEASE_SYMBOLIC_LINKS",
	{
		id: text("id").primaryKey(),
		releaseId: text("release_id").notNull(),
		name: text("name").notNull(),
		src: text("src").notNull(),
		dest: text("dest").notNull(),
		destRoot: text("dest_root").$type<SymbolicLinkDestRoot>().notNull(),
		installedPath: text("installed_path"),
	},
);

export const T_MOD_RELEASE_MISSION_SCRIPTS = sqliteTable(
	"MOD_RELEASE_MISSION_SCRIPTS",
	{
		id: text("id").primaryKey(),
		releaseId: text("release_id").notNull(),
		name: text("name").notNull(),
		purpose: text("purpose").notNull(),
		path: text("path").notNull(),
		root: text("root").$type<SymbolicLinkDestRoot>().notNull(),
		runOn: text("run_on").$type<MissionScriptRunOn>().notNull(),
		installedPath: text("installed_path"),
	},
);

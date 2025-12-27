import { writeFile } from "node:fs/promises";
import { and, eq, isNotNull } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { getLogger } from "log4js";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import { T_MOD_RELEASE_MISSION_SCRIPTS, T_MOD_RELEASES } from "../database/schema.ts";
import { generateDropzoneMissionScriptingScript } from "../functions/generateDropzoneMissionScriptingScript.ts";
import type { PathService } from "./PathService.ts";

export type RegenerateMissionScriptingFilesCommand = {
	db: BunSQLiteDatabase;
	pathService: PathService;
};

export type RegenerateMissionScriptingFilesResult = void;

const logger = getLogger("RegenerateMissionScriptingFilesCommand");

export default async function (
	command: RegenerateMissionScriptingFilesCommand,
): Promise<RegenerateMissionScriptingFilesResult> {
	logger.info("Regenerating Dropzone Mission Scripting Files");
	const { db, pathService } = command;

	logger.debug("Fetching mission scripts to run before sanitize");
	const beforeScripts = db
		.select({
			modName: T_MOD_RELEASES.modName,
			modVersion: T_MOD_RELEASES.version,
			path: T_MOD_RELEASE_MISSION_SCRIPTS.path,
			pathRoot: T_MOD_RELEASE_MISSION_SCRIPTS.root,
		})
		.from(T_MOD_RELEASE_MISSION_SCRIPTS)
		.innerJoin(T_MOD_RELEASES, eq(T_MOD_RELEASE_MISSION_SCRIPTS.releaseId, T_MOD_RELEASES.releaseId))
		.where(eq(T_MOD_RELEASE_MISSION_SCRIPTS.runOn, MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE))
		.all();
	logger.debug(`Fetched ${beforeScripts.length} scripts to run before sanitize, generating file...`);

	const beforeFile = await generateDropzoneMissionScriptingScript(
		beforeScripts.map((it) => ({
			id: `${it.modName}-${it.modVersion}`,
			path: pathService.getAbsoluteSymbolicLinkDestPath(it.pathRoot, it.path),
		})),
	);

	logger.debug("Writing before sanitize mission scripting file...");
	await writeFile(
		pathService.getAbsoluteSymbolicLinkDestPath(
			SymbolicLinkDestRoot.DCS_WORKING_DIR,
			"Scripts/DropzoneMissionScriptsBeforeSanitize.lua",
		),
		beforeFile,
	);

	logger.debug("Fetching mission scripts to run after sanitize");
	const afterScripts = db
		.select({
			modName: T_MOD_RELEASES.modName,
			modVersion: T_MOD_RELEASES.version,
			path: T_MOD_RELEASE_MISSION_SCRIPTS.path,
			pathRoot: T_MOD_RELEASE_MISSION_SCRIPTS.root,
		})
		.from(T_MOD_RELEASE_MISSION_SCRIPTS)
		.innerJoin(T_MOD_RELEASES, eq(T_MOD_RELEASE_MISSION_SCRIPTS.releaseId, T_MOD_RELEASES.releaseId))
		.where(eq(T_MOD_RELEASE_MISSION_SCRIPTS.runOn, MissionScriptRunOn.MISSION_START_AFTER_SANITIZE))
		.all();
	logger.debug(`Fetched ${afterScripts.length} scripts to run after sanitize, generating file...`);

	const afterFile = await generateDropzoneMissionScriptingScript(
		afterScripts.map((it) => ({
			id: `${it.modName}-${it.modVersion}`,
			path: pathService.getAbsoluteSymbolicLinkDestPath(it.pathRoot, it.path),
		})),
	);
	logger.debug("Writing after sanitize mission scripting file...");

	await writeFile(
		pathService.getAbsoluteSymbolicLinkDestPath(
			SymbolicLinkDestRoot.DCS_WORKING_DIR,
			"Scripts/DropzoneMissionScriptsAfterSanitize.lua",
		),
		afterFile,
	);
	logger.info("Regenerated Dropzone Mission Scripting Files");
}

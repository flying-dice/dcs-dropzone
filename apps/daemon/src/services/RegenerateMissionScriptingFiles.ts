import { getLogger } from "log4js";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import { generateDropzoneMissionScriptingScript } from "../functions/generateDropzoneMissionScriptingScript.ts";
import type { GetMissionScriptsByRunOn } from "../repository/GetMissionScriptsByRunOn.ts";
import type { _ResolveReleasePath } from "./_ResolveReleasePath.ts";
import type { _ResolveSymbolicLinkPath } from "./_ResolveSymbolicLinkPath.ts";
import type { _WriteFile } from "./_WriteFile.ts";

const logger = getLogger("RegenerateMissionScriptingFiles");

export class RegenerateMissionScriptingFiles {
	constructor(
		protected deps: {
			writeFile: _WriteFile;
			resolveReleasePath: _ResolveReleasePath;
			resolveSymbolicLinkPath: _ResolveSymbolicLinkPath;
			getMissionScriptsByRunOn: GetMissionScriptsByRunOn;
		},
	) {}

	execute() {
		logger.info("Regenerating Dropzone Mission Scripting Files");

		logger.debug("Fetching mission scripts to run before sanitize");

		const beforeScripts = this.deps.getMissionScriptsByRunOn.execute(MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE);

		logger.debug(`Fetched ${beforeScripts.length} scripts to run before sanitize, generating file...`);

		const beforeFile = generateDropzoneMissionScriptingScript(this.mapScriptsToPaths(beforeScripts));

		logger.debug("Writing before sanitize mission scripting file...");

		this.deps.writeFile.execute(
			this.deps.resolveSymbolicLinkPath.execute(
				SymbolicLinkDestRoot.DCS_WORKING_DIR,
				"Scripts/DropzoneMissionScriptsBeforeSanitize.lua",
			),
			beforeFile,
		);

		logger.debug("Fetching mission scripts to run after sanitize");

		const afterScripts = this.deps.getMissionScriptsByRunOn.execute(MissionScriptRunOn.MISSION_START_AFTER_SANITIZE);

		logger.debug(`Fetched ${afterScripts.length} scripts to run after sanitize, generating file...`);

		const afterFile = generateDropzoneMissionScriptingScript(this.mapScriptsToPaths(afterScripts));

		logger.debug("Writing after sanitize mission scripting file...");

		this.deps.writeFile.execute(
			this.deps.resolveSymbolicLinkPath.execute(
				SymbolicLinkDestRoot.DCS_WORKING_DIR,
				"Scripts/DropzoneMissionScriptsAfterSanitize.lua",
			),
			afterFile,
		);

		logger.info("Regenerated Dropzone Mission Scripting Files");
	}

	private mapScriptsToPaths(
		scripts: {
			modName: string;
			modVersion: string;
			path: string;
			pathRoot: SymbolicLinkDestRoot;
		}[],
	): { id: string; path: string }[] {
		return scripts.map((it) => ({
			id: `${it.modName}-${it.modVersion}`,
			path: this.deps.resolveSymbolicLinkPath.execute(it.pathRoot, it.path),
		}));
	}
}

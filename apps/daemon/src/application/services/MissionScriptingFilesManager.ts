import { getLogger } from "log4js";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import { MISSION_START_AFTER_SANITIZE, MISSION_START_BEFORE_SANITIZE } from "../../constants.ts";
import { generateDropzoneMissionScriptingScript } from "../functions/generateDropzoneMissionScriptingScript.ts";
import type { FileSystem } from "../ports/FileSystem.ts";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import type { PathResolver } from "./PathResolver.ts";

const logger = getLogger("MissionScriptingFilesManager");

export class MissionScriptingFilesManager {
	private static readonly PATHS: Record<MissionScriptRunOn, string> = {
		[MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE]: MISSION_START_BEFORE_SANITIZE,
		[MissionScriptRunOn.MISSION_START_AFTER_SANITIZE]: MISSION_START_AFTER_SANITIZE,
	};

	private readonly beforeAbsPath: string;
	private readonly afterAbsPath: string;

	constructor(
		protected deps: {
			fileSystem: FileSystem;
			releaseRepository: ReleaseRepository;
			pathResolver: PathResolver;
		},
	) {
		this.beforeAbsPath = this.deps.pathResolver.resolveSymbolicLinkPath(
			SymbolicLinkDestRoot.DCS_WORKING_DIR,
			MissionScriptingFilesManager.PATHS.MISSION_START_BEFORE_SANITIZE,
		);

		this.afterAbsPath = this.deps.pathResolver.resolveSymbolicLinkPath(
			SymbolicLinkDestRoot.DCS_WORKING_DIR,
			MissionScriptingFilesManager.PATHS.MISSION_START_AFTER_SANITIZE,
		);
	}

	rebuild() {
		logger.info("Regenerating Dropzone Mission Scripting Files");

		logger.debug("Fetching mission scripts to run before sanitize");

		const beforeScripts = this.deps.releaseRepository.getMissionScriptsByRunOn(
			MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
		);

		logger.debug(`Fetched ${beforeScripts.length} scripts to run before sanitize, generating file...`);

		const beforeFile = generateDropzoneMissionScriptingScript(
			MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
			this.mapScriptsToPaths(beforeScripts),
		);

		logger.debug("Writing before sanitize mission scripting file...");

		this.deps.fileSystem.writeFile(this.beforeAbsPath, beforeFile);

		logger.debug("Fetching mission scripts to run after sanitize");

		const afterScripts = this.deps.releaseRepository.getMissionScriptsByRunOn(
			MissionScriptRunOn.MISSION_START_AFTER_SANITIZE,
		);

		logger.debug(`Fetched ${afterScripts.length} scripts to run after sanitize, generating file...`);

		const afterFile = generateDropzoneMissionScriptingScript(
			MissionScriptRunOn.MISSION_START_AFTER_SANITIZE,
			this.mapScriptsToPaths(afterScripts),
		);

		logger.debug("Writing after sanitize mission scripting file...");

		this.deps.fileSystem.writeFile(this.afterAbsPath, afterFile);

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
			path: this.deps.pathResolver.resolveSymbolicLinkPath(it.pathRoot, it.path),
		}));
	}
}

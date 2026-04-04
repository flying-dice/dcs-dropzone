import { getLogger } from "log4js";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import { MISSION_START_AFTER_SANITIZE, MISSION_START_BEFORE_SANITIZE } from "../../constants.ts";
import { generateDropzoneMissionScriptingScript } from "../functions/generateDropzoneMissionScriptingScript.ts";
import type { FileSystem } from "../ports/FileSystem.ts";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import type { DcsPathError, PathResolver } from "./PathResolver.ts";

const logger = getLogger("MissionScriptingFilesManager");

export class MissionScriptingFilesManager {
	private static readonly PATHS: Record<MissionScriptRunOn, string> = {
		[MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE]: MISSION_START_BEFORE_SANITIZE,
		[MissionScriptRunOn.MISSION_START_AFTER_SANITIZE]: MISSION_START_AFTER_SANITIZE,
	};

	constructor(
		protected deps: {
			fileSystem: FileSystem;
			releaseRepository: ReleaseRepository;
			pathResolver: PathResolver;
		},
	) {}

	rebuild(): [void, null] | [undefined, DcsPathError] {
		logger.info("Regenerating Dropzone Mission Scripting Files");

		const [beforeAbsPath, beforeAbsPathErr] = this.deps.pathResolver.resolveSymbolicLinkPath(
			SymbolicLinkDestRoot.DCS_WORKING_DIR,
			MissionScriptingFilesManager.PATHS.MISSION_START_BEFORE_SANITIZE,
		);
		if (beforeAbsPathErr) return [undefined, beforeAbsPathErr] as const;

		const [afterAbsPath, afterAbsPathErr] = this.deps.pathResolver.resolveSymbolicLinkPath(
			SymbolicLinkDestRoot.DCS_WORKING_DIR,
			MissionScriptingFilesManager.PATHS.MISSION_START_AFTER_SANITIZE,
		);
		if (afterAbsPathErr) return [undefined, afterAbsPathErr] as const;

		const [dcsWorkingDir, dcsWorkingDirErr] = this.deps.pathResolver.resolveSymbolicLinkPath(
			SymbolicLinkDestRoot.DCS_WORKING_DIR,
		);
		if (dcsWorkingDirErr) return [undefined, dcsWorkingDirErr] as const;

		const dcsWorkingDirExists = this.deps.fileSystem.exists(dcsWorkingDir);
		if (!dcsWorkingDirExists) {
			logger.info("DCS working dir does not exist, skipping mission scripting files generation");
			return [undefined, null];
		}

		logger.debug("Fetching mission scripts to run before sanitize");

		const beforeScripts = this.deps.releaseRepository.getMissionScriptsByRunOn(
			MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
		);

		logger.debug(`Fetched ${beforeScripts.length} scripts to run before sanitize, generating file...`);

		const [beforePaths, beforePathsErr] = this.mapScriptsToPaths(beforeScripts);
		if (beforePathsErr) return [undefined, beforePathsErr] as const;

		const beforeFile = generateDropzoneMissionScriptingScript(
			MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
			beforePaths,
		);

		logger.debug("Writing before sanitize mission scripting file...");

		this.deps.fileSystem.writeFile(beforeAbsPath, beforeFile);

		logger.debug("Fetching mission scripts to run after sanitize");

		const afterScripts = this.deps.releaseRepository.getMissionScriptsByRunOn(
			MissionScriptRunOn.MISSION_START_AFTER_SANITIZE,
		);

		logger.debug(`Fetched ${afterScripts.length} scripts to run after sanitize, generating file...`);

		const [afterPaths, afterPathsErr] = this.mapScriptsToPaths(afterScripts);
		if (afterPathsErr) return [undefined, afterPathsErr] as const;

		const afterFile = generateDropzoneMissionScriptingScript(
			MissionScriptRunOn.MISSION_START_AFTER_SANITIZE,
			afterPaths,
		);

		logger.debug("Writing after sanitize mission scripting file...");

		this.deps.fileSystem.writeFile(afterAbsPath, afterFile);

		logger.info("Regenerated Dropzone Mission Scripting Files");

		return [undefined, null];
	}

	private mapScriptsToPaths(
		scripts: {
			modName: string;
			modVersion: string;
			path: string;
			pathRoot: SymbolicLinkDestRoot;
		}[],
	): [{ id: string; path: string }[], null] | [undefined, DcsPathError] {
		const results: { id: string; path: string }[] = [];
		for (const it of scripts) {
			const [resolvedPath, pathErr] = this.deps.pathResolver.resolveSymbolicLinkPath(it.pathRoot, it.path);
			if (pathErr) return [undefined, pathErr] as const;
			results.push({
				id: `${it.modName}-${it.modVersion}`,
				path: resolvedPath,
			});
		}
		return [results, null];
	}
}

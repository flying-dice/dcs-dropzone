import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import { MISSION_START_AFTER_SANITIZE, MISSION_START_BEFORE_SANITIZE } from "../../constants.ts";
import { generateDropzoneMissionScriptingScript } from "../functions/generateDropzoneMissionScriptingScript.ts";
import type { FileSystem } from "../ports/FileSystem.ts";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import type { DcsPathNotConfigured, PathResolver } from "./PathResolver.ts";

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

	rebuild(): Result<void, DcsPathNotConfigured> {
		logger.info("Regenerating Dropzone Mission Scripting Files");

		const beforeAbsPathResult = this.deps.pathResolver.resolveSymbolicLinkPath(
			SymbolicLinkDestRoot.DCS_WORKING_DIR,
			MissionScriptingFilesManager.PATHS.MISSION_START_BEFORE_SANITIZE,
		);
		if (beforeAbsPathResult.isErr()) return err(beforeAbsPathResult.error);

		const afterAbsPathResult = this.deps.pathResolver.resolveSymbolicLinkPath(
			SymbolicLinkDestRoot.DCS_WORKING_DIR,
			MissionScriptingFilesManager.PATHS.MISSION_START_AFTER_SANITIZE,
		);
		if (afterAbsPathResult.isErr()) return err(afterAbsPathResult.error);

		const dcsWorkingDirResult = this.deps.pathResolver.resolveSymbolicLinkPath(SymbolicLinkDestRoot.DCS_WORKING_DIR);
		if (dcsWorkingDirResult.isErr()) return err(dcsWorkingDirResult.error);

		const dcsWorkingDirExists = this.deps.fileSystem.exists(dcsWorkingDirResult.value).match(
			(v) => v,
			() => false,
		);
		if (!dcsWorkingDirExists) {
			logger.info("DCS working dir does not exist, skipping mission scripting files generation");
			return ok(undefined);
		}

		logger.debug("Fetching mission scripts to run before sanitize");

		const beforeScripts = this.deps.releaseRepository.getMissionScriptsByRunOn(
			MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
		);

		logger.debug(`Fetched ${beforeScripts.length} scripts to run before sanitize, generating file...`);

		const beforePathsResult = this.mapScriptsToPaths(beforeScripts);
		if (beforePathsResult.isErr()) return err(beforePathsResult.error);

		const beforeFile = generateDropzoneMissionScriptingScript(
			MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
			beforePathsResult.value,
		);

		logger.debug("Writing before sanitize mission scripting file...");

		this.deps.fileSystem.writeFile(beforeAbsPathResult.value, beforeFile);

		logger.debug("Fetching mission scripts to run after sanitize");

		const afterScripts = this.deps.releaseRepository.getMissionScriptsByRunOn(
			MissionScriptRunOn.MISSION_START_AFTER_SANITIZE,
		);

		logger.debug(`Fetched ${afterScripts.length} scripts to run after sanitize, generating file...`);

		const afterPathsResult = this.mapScriptsToPaths(afterScripts);
		if (afterPathsResult.isErr()) return err(afterPathsResult.error);

		const afterFile = generateDropzoneMissionScriptingScript(
			MissionScriptRunOn.MISSION_START_AFTER_SANITIZE,
			afterPathsResult.value,
		);

		logger.debug("Writing after sanitize mission scripting file...");

		this.deps.fileSystem.writeFile(afterAbsPathResult.value, afterFile);

		logger.info("Regenerated Dropzone Mission Scripting Files");

		return ok(undefined);
	}

	private mapScriptsToPaths(
		scripts: {
			modName: string;
			modVersion: string;
			path: string;
			pathRoot: SymbolicLinkDestRoot;
		}[],
	): Result<{ id: string; path: string }[], DcsPathNotConfigured> {
		const results: { id: string; path: string }[] = [];
		for (const it of scripts) {
			const pathResult = this.deps.pathResolver.resolveSymbolicLinkPath(it.pathRoot, it.path);
			if (pathResult.isErr()) return err(pathResult.error);
			results.push({
				id: `${it.modName}-${it.modVersion}`,
				path: pathResult.value,
			});
		}
		return ok(results);
	}
}

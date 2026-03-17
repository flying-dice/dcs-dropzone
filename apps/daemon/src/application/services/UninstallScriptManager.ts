import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import { SymbolicLinkDestRoot } from "webapp";
import { MISSION_START_AFTER_SANITIZE, MISSION_START_BEFORE_SANITIZE } from "../../constants.ts";
import { generateUninstallScript } from "../functions/generateUninstallScript.ts";
import type { FileSystem } from "../ports/FileSystem.ts";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import type { DcsPathNotConfigured, PathResolver } from "./PathResolver.ts";

const logger = getLogger("UninstallScriptManager");

export class UninstallScriptManager {
	constructor(
		protected deps: {
			fileSystem: FileSystem;
			releaseRepository: ReleaseRepository;
			pathResolver: PathResolver;
			getDropzoneModsFolder: () => string | undefined;
		},
	) {}

	@Log(logger)
	rebuild(): Result<void, DcsPathNotConfigured> {
		logger.info("Regenerating uninstall.bat");

		const installedPaths = this.deps.releaseRepository.getAllInstalledSymbolicLinkPaths();
		logger.debug(`Found ${installedPaths.length} installed symbolic link paths`);

		const missionScriptPaths: string[] = [];

		const beforeAbsPathResult = this.deps.pathResolver.resolveSymbolicLinkPath(
			SymbolicLinkDestRoot.DCS_WORKING_DIR,
			MISSION_START_BEFORE_SANITIZE,
		);
		if (beforeAbsPathResult.isErr()) return err(beforeAbsPathResult.error);
		missionScriptPaths.push(beforeAbsPathResult.value);

		const afterAbsPathResult = this.deps.pathResolver.resolveSymbolicLinkPath(
			SymbolicLinkDestRoot.DCS_WORKING_DIR,
			MISSION_START_AFTER_SANITIZE,
		);
		if (afterAbsPathResult.isErr()) return err(afterAbsPathResult.error);
		missionScriptPaths.push(afterAbsPathResult.value);

		const content = generateUninstallScript(installedPaths, missionScriptPaths);

		const dropzoneModsFolder = this.deps.getDropzoneModsFolder();
		const outputDir = dropzoneModsFolder
			? this.deps.fileSystem.resolve(dropzoneModsFolder, "..")
			: this.deps.fileSystem.resolve(".");

		const outputPath = this.deps.fileSystem.resolve(outputDir, "uninstall.bat");
		logger.debug(`Writing uninstall.bat to ${outputPath}`);
		this.deps.fileSystem.writeFile(outputPath, content);

		logger.info("Regenerated uninstall.bat");
		return ok(undefined);
	}
}

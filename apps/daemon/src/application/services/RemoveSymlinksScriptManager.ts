import { getLogger } from "log4js";
import { SymbolicLinkDestRoot } from "webapp";
import { MISSION_START_AFTER_SANITIZE, MISSION_START_BEFORE_SANITIZE } from "../../constants.ts";
import { generateRemoveSymlinksScript } from "../functions/generateRemoveSymlinksScript.ts";
import type { FileSystem } from "../ports/FileSystem.ts";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import { DcsPathNotConfigured, type PathResolver } from "./PathResolver.ts";

const logger = getLogger("RemoveSymlinksScriptManager");

export class RemoveSymlinksScriptManager {
	constructor(
		protected deps: {
			fileSystem: FileSystem;
			releaseRepository: ReleaseRepository;
			pathResolver: PathResolver;
			getDropzoneModsFolder: () => string | undefined;
		},
	) {}

	filePath(): [string, null] | [undefined, DcsPathNotConfigured] {
		const dropzoneModsFolder = this.deps.getDropzoneModsFolder();

		if (!dropzoneModsFolder) {
			return [undefined, new DcsPathNotConfigured()];
		}

		return [this.deps.fileSystem.resolve(dropzoneModsFolder, "removeSymlinks.bat"), null];
	}

	rebuild(): [void, null] | [undefined, DcsPathNotConfigured] {
		logger.info("Regenerating removeSymlinks.bat");

		const dropzoneModsFolder = this.deps.getDropzoneModsFolder();
		if (!dropzoneModsFolder) {
			return [undefined, new DcsPathNotConfigured()];
		}

		const folderExists = this.deps.fileSystem.exists(dropzoneModsFolder);
		if (!folderExists) {
			logger.info("Mods folder does not exist, skipping removeSymlinks.bat generation");
			return [undefined, null];
		}

		const installedPaths = this.deps.releaseRepository.getAllInstalledSymbolicLinkPaths();
		logger.debug(`Found ${installedPaths.length} installed symbolic link paths`);

		const missionScriptPaths: string[] = [];

		const [beforeAbsPath, beforeAbsPathErr] = this.deps.pathResolver.resolveSymbolicLinkPath(
			SymbolicLinkDestRoot.DCS_WORKING_DIR,
			MISSION_START_BEFORE_SANITIZE,
		);
		if (beforeAbsPathErr) return [undefined, beforeAbsPathErr] as const;
		missionScriptPaths.push(beforeAbsPath);

		const [afterAbsPath, afterAbsPathErr] = this.deps.pathResolver.resolveSymbolicLinkPath(
			SymbolicLinkDestRoot.DCS_WORKING_DIR,
			MISSION_START_AFTER_SANITIZE,
		);
		if (afterAbsPathErr) return [undefined, afterAbsPathErr] as const;
		missionScriptPaths.push(afterAbsPath);

		const content = generateRemoveSymlinksScript(installedPaths, missionScriptPaths);

		const [filePath, filePathErr] = this.filePath();
		if (filePathErr) return [undefined, filePathErr] as const;

		logger.debug(`Writing removeSymlinks.bat to ${filePath}`);
		this.deps.fileSystem.writeFile(filePath, content);

		logger.info("Regenerated removeSymlinks.bat");
		return [undefined, null];
	}
}

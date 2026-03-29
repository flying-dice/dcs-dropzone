import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
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

	filePath(): Result<string, DcsPathNotConfigured> {
		const dropzoneModsFolder = this.deps.getDropzoneModsFolder();

		if (!dropzoneModsFolder) {
			return err(new DcsPathNotConfigured());
		}

		return ok(this.deps.fileSystem.resolve(dropzoneModsFolder, "removeSymlinks.bat"));
	}

	rebuild(): Result<void, DcsPathNotConfigured> {
		logger.info("Regenerating removeSymlinks.bat");

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

		const content = generateRemoveSymlinksScript(installedPaths, missionScriptPaths);

		return this.filePath().andThen((_path) => {
			logger.debug(`Writing removeSymlinks.bat to ${_path}`);
			this.deps.fileSystem.writeFile(_path, content);

			logger.info("Regenerated removeSymlinks.bat");
			return ok(undefined);
		});
	}
}

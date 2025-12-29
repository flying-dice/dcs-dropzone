import type { FileSystem } from "../../services/FileSystem.ts";
import { PathResolver } from "../../services/PathResolver.ts";

export class TestPathResolver extends PathResolver {
	constructor(
		dropzoneModsFolder = "/dropzone/mods",
		dcsInstallDir = "/dcs/install",
		dcsWorkingDir = "/dcs/working",
		fileSystem: FileSystem,
	) {
		super({
			dropzoneModsFolder,
			dcsInstallDir,
			dcsWorkingDir,
			fileSystem,
		});
	}
}

import type { SymbolicLinkDestRoot } from "webapp";
import type { FileSystem } from "./FileSystem.ts";

type Deps = {
	dropzoneModsFolder: string;
	dcsInstallDir: string;
	dcsWorkingDir: string;
	fileSystem: FileSystem;
};

export class PathResolver {
	private readonly dcsPaths: Record<SymbolicLinkDestRoot, string>;

	constructor(protected deps: Deps) {
		this.dcsPaths = {
			DCS_INSTALL_DIR: this.deps.dcsInstallDir,
			DCS_WORKING_DIR: this.deps.dcsWorkingDir,
		};
	}

	resolveReleasePath(releaseId: string, path?: string): string {
		if (path) {
			return this.deps.fileSystem.resolve(this.deps.dropzoneModsFolder, releaseId, path);
		}

		return this.deps.fileSystem.resolve(this.deps.dropzoneModsFolder, releaseId);
	}

	resolveSymbolicLinkPath(root: SymbolicLinkDestRoot, path?: string): string {
		const rootPath = this.dcsPaths[root];

		if (!rootPath) {
			throw new Error(`Path for destRoot ${root} is not configured`);
		}

		if (path) {
			return this.deps.fileSystem.resolve(rootPath, path);
		}

		return this.deps.fileSystem.resolve(rootPath);
	}
}

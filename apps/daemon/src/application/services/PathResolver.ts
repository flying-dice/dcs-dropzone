import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import type { SymbolicLinkDestRoot } from "webapp";
import type { FileSystem } from "../ports/FileSystem.ts";

const logger = getLogger("PathResolver");

type Deps = {
	dropzoneModsFolder: string;
	dcsPaths: Record<SymbolicLinkDestRoot, string>;
	fileSystem: FileSystem;
};

export class PathResolver {
	constructor(protected deps: Deps) {}

	@Log(logger)
	resolveReleasePath(releaseId: string, path?: string): string {
		if (path) {
			return this.deps.fileSystem.resolve(this.deps.dropzoneModsFolder, releaseId, path);
		}

		return this.deps.fileSystem.resolve(this.deps.dropzoneModsFolder, releaseId);
	}

	@Log(logger)
	resolveSymbolicLinkPath(root: SymbolicLinkDestRoot, path?: string): string {
		const rootPath = this.deps.dcsPaths[root];

		if (!rootPath) {
			throw new Error(`Path for destRoot ${root} is not configured`);
		}

		if (path) {
			return this.deps.fileSystem.resolve(rootPath, path);
		}

		return this.deps.fileSystem.resolve(rootPath);
	}
}

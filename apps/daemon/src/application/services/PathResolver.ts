import { getLogger } from "log4js";
import type { SymbolicLinkDestRoot } from "webapp";
import type { FileSystem } from "../ports/FileSystem.ts";

const _logger = getLogger("PathResolver");

export class DropzoneModsDirNotConfigured extends Error {
	readonly type = "DropzoneModsDirNotConfigured" as const;
	constructor() {
		super("Dropzone mods directory is not configured");
	}
}

export class DcsPathNotConfigured extends Error {
	readonly type = "DcsPathNotConfigured" as const;
	constructor() {
		super("DCS path is not configured");
	}
}

export type PathResolverError = DropzoneModsDirNotConfigured | DcsPathNotConfigured;

type Deps = {
	getDropzoneModsFolder: () => string | undefined;
	getDcsPathForSymbolicLinkDestRoot: (root: SymbolicLinkDestRoot) => string | undefined;
	fileSystem: FileSystem;
};

export class PathResolver {
	constructor(protected deps: Deps) {}

	resolveReleasePath(releaseId: string, path?: string): [string, null] | [undefined, DropzoneModsDirNotConfigured] {
		const dropzoneModsFolder = this.deps.getDropzoneModsFolder();

		if (!dropzoneModsFolder) {
			return [undefined, new DropzoneModsDirNotConfigured()];
		}

		const exists = this.deps.fileSystem.exists(dropzoneModsFolder);
		if (!exists) {
			return [undefined, new DropzoneModsDirNotConfigured()];
		}

		if (path) {
			return [this.deps.fileSystem.resolve(dropzoneModsFolder, releaseId, path), null];
		}

		return [this.deps.fileSystem.resolve(dropzoneModsFolder, releaseId), null];
	}

	resolveSymbolicLinkPath(
		root: SymbolicLinkDestRoot,
		path?: string,
	): [string, null] | [undefined, DcsPathNotConfigured] {
		const rootPath = this.deps.getDcsPathForSymbolicLinkDestRoot(root);

		if (!rootPath) {
			return [undefined, new DcsPathNotConfigured()];
		}

		if (path) {
			return [this.deps.fileSystem.resolve(rootPath, path), null];
		}

		return [this.deps.fileSystem.resolve(rootPath), null];
	}
}

import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
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

	resolveReleasePath(releaseId: string, path?: string): Result<string, DropzoneModsDirNotConfigured> {
		const dropzoneModsFolder = this.deps.getDropzoneModsFolder();

		if (!dropzoneModsFolder) {
			return err(new DropzoneModsDirNotConfigured());
		}

		const existsResult = this.deps.fileSystem.exists(dropzoneModsFolder);
		const exists = existsResult.match(
			(v) => v,
			() => false,
		);
		if (!exists) {
			return err(new DropzoneModsDirNotConfigured());
		}

		if (path) {
			return ok(this.deps.fileSystem.resolve(dropzoneModsFolder, releaseId, path));
		}

		return ok(this.deps.fileSystem.resolve(dropzoneModsFolder, releaseId));
	}

	resolveSymbolicLinkPath(root: SymbolicLinkDestRoot, path?: string): Result<string, DcsPathNotConfigured> {
		const rootPath = this.deps.getDcsPathForSymbolicLinkDestRoot(root);

		if (!rootPath) {
			return err(new DcsPathNotConfigured());
		}

		if (path) {
			return ok(this.deps.fileSystem.resolve(rootPath, path));
		}

		return ok(this.deps.fileSystem.resolve(rootPath));
	}
}

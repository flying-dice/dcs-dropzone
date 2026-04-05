import { getLogger } from "log4js";
import type { SymbolicLinkDestRoot } from "webapp";
import type { z } from "zod";
import type { FileSystem } from "../ports/FileSystem.ts";
import type {
	DcsPathInvalidError,
	DcsPathNotConfiguredError,
	DropzoneModsDirInvalidError,
	DropzoneModsDirNotConfiguredError,
} from "../schemas/ToggleErrors.ts";

const _logger = getLogger("PathResolver");

export type DropzoneModsDirError =
	| z.infer<typeof DropzoneModsDirNotConfiguredError>
	| z.infer<typeof DropzoneModsDirInvalidError>;

export type DcsPathError = z.infer<typeof DcsPathNotConfiguredError> | z.infer<typeof DcsPathInvalidError>;

export type PathResolverError = DropzoneModsDirError | DcsPathError;

type Deps = {
	getDropzoneModsFolder: () => string | undefined;
	getDcsPathForSymbolicLinkDestRoot: (root: SymbolicLinkDestRoot) => string | undefined;
	fileSystem: FileSystem;
};

export class PathResolver {
	constructor(protected deps: Deps) {}

	resolveReleasePath(releaseId: string, path?: string): [string, null] | [undefined, DropzoneModsDirError] {
		const dropzoneModsFolder = this.deps.getDropzoneModsFolder();

		if (!dropzoneModsFolder) {
			return [undefined, { reason: "DropzoneModsDirNotConfigured" as const }];
		}

		const exists = this.deps.fileSystem.exists(dropzoneModsFolder);
		if (!exists) {
			return [
				undefined,
				{ reason: "DropzoneModsDirInvalid" as const, errorCode: "PATH_NOT_FOUND" as const, path: dropzoneModsFolder },
			];
		}

		if (path) {
			return [this.deps.fileSystem.resolve(dropzoneModsFolder, releaseId, path), null];
		}

		return [this.deps.fileSystem.resolve(dropzoneModsFolder, releaseId), null];
	}

	resolveSymbolicLinkPath(root: SymbolicLinkDestRoot, path?: string): [string, null] | [undefined, DcsPathError] {
		const rootPath = this.deps.getDcsPathForSymbolicLinkDestRoot(root);

		if (!rootPath) {
			return [undefined, { reason: "DcsPathNotConfigured" as const }];
		}

		if (path) {
			return [this.deps.fileSystem.resolve(rootPath, path), null];
		}

		return [this.deps.fileSystem.resolve(rootPath), null];
	}
}

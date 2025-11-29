import { ok } from "node:assert";
import { join } from "node:path";
import { getLogger } from "log4js";
import type { SymbolicLinkDestRoot } from "../../common/data.ts";
import { secureJoin } from "../functions/secureJoin.ts";

const logger = getLogger("PathService");

export class PathService {
	constructor(
		private readonly dcsPaths: Record<SymbolicLinkDestRoot, string>,
		private readonly dropzoneWorkingDir: string,
	) {}

	getDestRootPath(destRoot: SymbolicLinkDestRoot): string {
		logger.debug("PathService getDestRootPath", destRoot);
		const p = this.dcsPaths[destRoot];

		logger.debug("Resolved path:", p);

		ok(p, `Path for destRoot ${destRoot} is not configured`);

		return p;
	}

	getDropzoneWorkingDir(): string {
		return this.dropzoneWorkingDir;
	}

	getReleaseWorkingDirectory(releaseId: string): string {
		return join(this.getDropzoneWorkingDir(), releaseId);
	}

	getAbsoluteReleasePath(releaseId: string, path: string): string {
		return secureJoin(this.getReleaseWorkingDirectory(releaseId), path);
	}

	getAbsoluteSymbolicLinkDestPath(
		destRoot: SymbolicLinkDestRoot,
		path: string,
	): string {
		return secureJoin(this.getDestRootPath(destRoot), path);
	}
}

import { join } from "node:path";
import { getLogger } from "log4js";

const logger = getLogger("ResolveReleaseDir");

type Deps = {
	dropzoneModsFolder: string;
};

type Args = {
	releaseId: string;
};

type Result = string;

export default (deps: Deps): ResolveReleaseDir => {
	logger.debug("PathService initialized with dropzoneModsFolder:", deps.dropzoneModsFolder);

	return (args) => {
		return join(deps.dropzoneModsFolder, args.releaseId);
	};
};

export type ResolveReleaseDirDeps = Deps;
export type ResolveReleaseDirArgs = Args;
export type ResolveReleaseDirResult = Result;
export type ResolveReleaseDir = (args: ResolveReleaseDirArgs) => ResolveReleaseDirResult;

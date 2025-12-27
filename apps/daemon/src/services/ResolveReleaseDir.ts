import { join } from "node:path";
import { getLogger } from "log4js";

const logger = getLogger("ResolveReleaseDir");

export class ResolveReleaseDir {
	constructor(
		protected deps: {
			dropzoneModsFolder: string;
		},
	) {}

	execute(releaseId: string): string {
		return join(this.deps.dropzoneModsFolder, releaseId);
	}
}

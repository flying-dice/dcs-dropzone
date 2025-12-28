import { resolve } from "node:path";

export class _ResolveReleasePath {
	constructor(
		protected deps: {
			dropzoneModsFolder: string;
		},
	) {}

	execute(releaseId: string, path?: string): string {
		if (path) {
			return resolve(this.deps.dropzoneModsFolder, releaseId, path);
		}

		return resolve(this.deps.dropzoneModsFolder, releaseId);
	}
}

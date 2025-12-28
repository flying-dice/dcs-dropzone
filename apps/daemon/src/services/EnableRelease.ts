import type { GetSymbolicLinksForReleaseId } from "../repository/GetSymbolicLinksForReleaseId.ts";
import type { SetInstalledPathForLinkId } from "../repository/SetInstalledPathForLinkId.ts";
import type { _EnsureSymlink } from "./_EnsureSymlink.ts";
import type { _ResolveReleasePath } from "./_ResolveReleasePath.ts";
import type { _ResolveSymbolicLinkPath } from "./_ResolveSymbolicLinkPath.ts";
import type { RegenerateMissionScriptingFiles } from "./RegenerateMissionScriptingFiles.ts";

export class EnableRelease {
	constructor(
		protected deps: {
			regenerateMissionScriptingFiles: RegenerateMissionScriptingFiles;
			setInstalledPathForLinkId: SetInstalledPathForLinkId;
			getSymbolicLinksForReleaseId: GetSymbolicLinksForReleaseId;
			resolveReleasePath: _ResolveReleasePath;
			resolveSymbolicLinkPath: _ResolveSymbolicLinkPath;
			onCreateSymlink?: (src: string, dest: string) => void;
			ensureSymlink: _EnsureSymlink;
		},
	) {}

	execute(releaseId: string): void {
		const links = this.deps.getSymbolicLinksForReleaseId.execute(releaseId);

		for (const link of links) {
			const srcAbs = this.deps.resolveReleasePath.execute(releaseId, link.src);
			const destAbs = this.deps.resolveSymbolicLinkPath.execute(link.destRoot, link.dest);

			this.deps.ensureSymlink.execute(srcAbs, destAbs);

			this.deps.setInstalledPathForLinkId.execute(link.id, destAbs);

			this.deps.onCreateSymlink?.(srcAbs, destAbs);
		}

		this.deps.regenerateMissionScriptingFiles.execute();
	}
}

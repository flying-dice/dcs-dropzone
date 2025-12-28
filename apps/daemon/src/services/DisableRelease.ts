import { getLogger } from "log4js";
import type { GetSymbolicLinksForReleaseId } from "../repository/GetSymbolicLinksForReleaseId.ts";
import type { SetInstalledPathForLinkId } from "../repository/SetInstalledPathForLinkId.ts";
import type { _RemoveDir } from "./_RemoveDir.ts";
import type { RegenerateMissionScriptingFiles } from "./RegenerateMissionScriptingFiles.ts";

const logger = getLogger("DisableRelease");

export class DisableRelease {
	constructor(
		protected deps: {
			regenerateMissionScriptingFiles: RegenerateMissionScriptingFiles;
			setInstalledPathForLinkId: SetInstalledPathForLinkId;
			getSymbolicLinksForReleaseId: GetSymbolicLinksForReleaseId;
			removeDir: _RemoveDir;
		},
	) {}

	execute(releaseId: string) {
		logger.info("Disabling Release");

		const links = this.deps.getSymbolicLinksForReleaseId.execute(releaseId);

		for (const link of links) {
			if (link.installedPath) {
				try {
					this.deps.removeDir.execute(link.installedPath);
					this.deps.setInstalledPathForLinkId.execute(link.id, null);
				} catch (err) {
					logger.error(`Failed to remove symbolic link at ${link.installedPath}: ${err}`);
				}
			}
		}

		this.deps.regenerateMissionScriptingFiles.execute();
	}
}

import {rmSync} from "fs-extra";
import {getLogger} from "log4js";
import type {GetSymbolicLinksForReleaseId} from "../repository/GetSymbolicLinksForReleaseId.ts";
import type {SetInstalledPathForLinkId} from "../repository/SetInstalledPathForLinkId.ts";

const logger = getLogger("DisableRelease");

export class DisableRelease {
	constructor(
		protected deps: {
			regenerateMissionScriptFilesHandler: () => Promise<void>;
            setInstalledPathForLinkId: SetInstalledPathForLinkId;
			getSymbolicLinksForReleaseId: GetSymbolicLinksForReleaseId;
		},
	) {}

	async execute(releaseId: string): Promise<void> {
		logger.info("Disabling Release");

		const links = this.deps.getSymbolicLinksForReleaseId.execute(releaseId);

		for (const link of links) {
			if (link.installedPath) {
				try {
					rmSync(link.installedPath, { force: true, recursive: true });
					this.deps.setInstalledPathForLinkId.execute(link.id, null);
				} catch (err) {
					logger.error(`Failed to remove symbolic link at ${link.installedPath}: ${err}`);
				}
			}
		}

		await this.deps.regenerateMissionScriptFilesHandler();
	}
}

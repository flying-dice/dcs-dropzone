import {ensureSymlinkSync} from "fs-extra";
import {getLogger} from "log4js";
import {getSymlinkType} from "../functions/getSymlinkType.ts";
import type {PathService} from "./PathService.ts";
import type {SetInstalledPathForLinkId} from "../repository/SetInstalledPathForLinkId.ts";
import type {GetSymbolicLinksForReleaseId} from "../repository/GetSymbolicLinksForReleaseId.ts";


const logger = getLogger("EnableRelease");

export class EnableRelease {
	constructor(
		protected deps: {
			regenerateMissionScriptFilesHandler: () => Promise<void>;
            setInstalledPathForLinkId: SetInstalledPathForLinkId
            getSymbolicLinksForReleaseId: GetSymbolicLinksForReleaseId
			pathService: PathService;
            onCreateSymlink?: (src: string, dest: string) => void;
		},
	) {}

    async execute(releaseId: string): Promise<void> {

        const links = this.deps.getSymbolicLinksForReleaseId.execute(releaseId);
        for (const link of links) {
            const srcAbs = this.deps.pathService.getAbsoluteReleasePath(releaseId, link.src);
            const destAbs = this.deps.pathService.getAbsoluteSymbolicLinkDestPath(link.destRoot, link.dest);

            const type = getSymlinkType(srcAbs);
            logger.info(`Creating symlink from ${srcAbs} to ${destAbs} with type ${type}`);
            ensureSymlinkSync(srcAbs, destAbs, type);

            this.deps.setInstalledPathForLinkId.execute(link.id, destAbs);

            this.deps.onCreateSymlink?.(srcAbs, destAbs);
        }

        await this.deps.regenerateMissionScriptFilesHandler();
    }
}

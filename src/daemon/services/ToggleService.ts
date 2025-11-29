import { ensureSymlinkSync, rmSync } from "fs-extra";
import { getLogger } from "log4js";
import { getSymlinkType } from "../functions/getSymlinkType.ts";
import type { ModReleaseSymbolicLinkRepository } from "../repositories/ModReleaseSymbolicLinkRepository.ts";
import type { PathService } from "./PathService.ts";

const logger = getLogger("ToggleService");

export type ToggleServiceOptions = {
	pathService: PathService;
	linkRepo: ModReleaseSymbolicLinkRepository;
};

export class ToggleService {
	private readonly pathService: PathService;
	private readonly linkRepo: ModReleaseSymbolicLinkRepository;

	constructor(opts: ToggleServiceOptions) {
		this.pathService = opts.pathService;
		this.linkRepo = opts.linkRepo;
	}

	isReleaseEnabled(releaseId: string): boolean {
		const links = this.linkRepo.getByReleaseId(releaseId);
		return links.every((link) => link.installedPath !== null);
	}

	enableRelease(releaseId: string) {
		logger.debug(`Enable release ${releaseId}`);
		this.createLinksForRelease(releaseId);
		logger.info("Release enabled");
	}

	disableRelease(releaseId: string) {
		logger.debug(`Disable release ${releaseId}`);
		this.removeLinksForRelease(releaseId);
		logger.info("Release disabled");
	}

	createLinksForRelease(releaseId: string): void {
		const links = this.linkRepo.getByReleaseId(releaseId);

		logger.info(
			`Creating Links for release ${releaseId} with ${links.length} link(s)`,
		);

		for (const link of links) {
			const srcAbs = this.pathService.getAbsoluteReleasePath(
				releaseId,
				link.src,
			);

			const destAbs = this.pathService.getAbsoluteSymbolicLinkDestPath(
				link.destRoot,
				link.dest,
			);

			const type = getSymlinkType(srcAbs);
			logger.debug(
				`Creating symlink from ${srcAbs} to ${destAbs} with type ${type}`,
			);
			ensureSymlinkSync(srcAbs, destAbs, type);
			this.linkRepo.setInstalledPath(link.id, destAbs);
		}
	}

	removeLinksForRelease(releaseId: string) {
		const links = this.linkRepo.getByReleaseId(releaseId);

		logger.info(
			`Removing Links for release ${releaseId} with ${links.length} link(s)`,
		);

		for (const link of links) {
			if (link.installedPath) {
				try {
					rmSync(link.installedPath, { force: true, recursive: true });
					this.linkRepo.setInstalledPath(link.id, null);
				} catch (err) {
					logger.error(
						`Failed to remove symbolic link at ${link.installedPath}: ${err}`,
					);
				}
			}
		}
	}
}

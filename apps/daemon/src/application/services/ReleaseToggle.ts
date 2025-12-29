import { ok } from "node:assert";
import { getLogger } from "log4js";
import { DownloadJobStatus } from "../enums/DownloadJobStatus.ts";
import { ExtractJobStatus } from "../enums/ExtractJobStatus.ts";
import type { ReleaseRepository } from "../repository/ReleaseRepository.ts";
import type { DownloadQueue } from "./DownloadQueue.ts";
import type { ExtractQueue } from "./ExtractQueue.ts";
import type { FileSystem } from "./FileSystem.ts";
import type { MissionScriptingFilesManager } from "./MissionScriptingFilesManager.ts";
import type { PathResolver } from "./PathResolver.ts";

const logger = getLogger("ReleaseToggle");

type Deps = {
	missionScriptingFilesManager: MissionScriptingFilesManager;
	pathResolver: PathResolver;
	onCreateSymlink?: (src: string, dest: string) => void;
	releaseRepository: ReleaseRepository;
	fileSystem: FileSystem;
	downloadQueue: DownloadQueue;
	extractQueue: ExtractQueue;
};

export class ReleaseToggle {
	constructor(protected deps: Deps) {}

	enable(releaseId: string): void {
		logger.info(`Enabling Release ${releaseId}`);
		this.ensureReleaseIsReady(releaseId);

		const links = this.deps.releaseRepository.getSymbolicLinksForRelease(releaseId);
		logger.debug(`Found ${links.length} symbolic links for release ${releaseId}`);

		for (const link of links) {
			const srcAbs = this.deps.pathResolver.resolveReleasePath(releaseId, link.src);
			const destAbs = this.deps.pathResolver.resolveSymbolicLinkPath(link.destRoot, link.dest);

			logger.debug(`Creating symlink (release=${releaseId}, linkId=${link.id}, src=${srcAbs}, dest=${destAbs})`);
			this.deps.fileSystem.ensureSymlink(srcAbs, destAbs);

			this.deps.releaseRepository.setInstalledPathForSymbolicLink(link.id, destAbs);
			logger.debug(`Stored installed symlink path for linkId ${link.id}: ${destAbs}`);

			if (this.deps.onCreateSymlink) {
				logger.trace(`Calling onCreateSymlink callback for ${srcAbs} -> ${destAbs}`);
				this.deps.onCreateSymlink(srcAbs, destAbs);
			}
		}

		logger.info(`Rebuilding mission scripting files after enabling release ${releaseId}`);
		this.deps.missionScriptingFilesManager.rebuild();
		logger.info(`Finished enabling Release ${releaseId}`);
	}

	disable(releaseId: string): void {
		logger.info(`Disabling Release ${releaseId}`);
		this.ensureReleaseIsReady(releaseId);

		const links = this.deps.releaseRepository.getSymbolicLinksForRelease(releaseId);
		logger.debug(`Found ${links.length} symbolic links for release ${releaseId}`);

		for (const link of links) {
			if (link.installedPath) {
				logger.debug(`Removing symlink for linkId ${link.id} at ${link.installedPath}`);
				try {
					this.deps.fileSystem.removeDir(link.installedPath);
					this.deps.releaseRepository.setInstalledPathForSymbolicLink(link.id, null);
					logger.debug(`Cleared installed symlink path for linkId ${link.id}`);
				} catch (err) {
					logger.error(`Failed to remove path for linkId ${link.id} at ${link.installedPath}: ${err}`);
				}
			} else {
				logger.trace(`Skipping linkId ${link.id} (no installedPath)`);
			}
		}

		logger.info(`Rebuilding mission scripting files after disabling release ${releaseId}`);
		this.deps.missionScriptingFilesManager.rebuild();
		logger.info(`Finished disabling Release ${releaseId}`);
	}

	private ensureReleaseIsReady(releaseId: string): void {
		logger.debug(`Checking if release ${releaseId} is ready`);

		if (
			!this.deps.downloadQueue.getJobsForReleaseId(releaseId).every((it) => it.status === DownloadJobStatus.COMPLETED)
		) {
			logger.warn(`Release ${releaseId} is not ready: some download jobs are incomplete`);
			throw new Error(`Cannot enable release ${releaseId} because not all download jobs are completed.`);
		}

		if (
			!this.deps.extractQueue.getJobsForReleaseId(releaseId).every((it) => it.status === ExtractJobStatus.COMPLETED)
		) {
			logger.warn(`Release ${releaseId} is not ready: some extract jobs are incomplete`);
			throw new Error(`Cannot enable release ${releaseId} because not all extract jobs are completed.`);
		}

		logger.debug(`Release ${releaseId} is ready for activation`);
	}
}

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
		logger.info("Enabling Release");
		this.ensureReleaseIsReady(releaseId);

		const links = this.deps.releaseRepository.getSymbolicLinksForRelease(releaseId);

		for (const link of links) {
			const srcAbs = this.deps.pathResolver.resolveReleasePath(releaseId, link.src);
			const destAbs = this.deps.pathResolver.resolveSymbolicLinkPath(link.destRoot, link.dest);

			this.deps.fileSystem.ensureSymlink(srcAbs, destAbs);

			this.deps.releaseRepository.setInstalledPathForSymbolicLink(link.id, destAbs);

			this.deps.onCreateSymlink?.(srcAbs, destAbs);
		}

		this.deps.missionScriptingFilesManager.rebuild();
	}

	disable(releaseId: string): void {
		logger.info("Disabling Release");
		this.ensureReleaseIsReady(releaseId);

		const links = this.deps.releaseRepository.getSymbolicLinksForRelease(releaseId);

		for (const link of links) {
			if (link.installedPath) {
				try {
					this.deps.fileSystem.removeDir(link.installedPath);
					this.deps.releaseRepository.setInstalledPathForSymbolicLink(link.id, null);
				} catch (err) {
					logger.error(`Failed to remove symbolic link at ${link.installedPath}: ${err}`);
				}
			}
		}

		this.deps.missionScriptingFilesManager.rebuild();
	}

	private ensureReleaseIsReady(releaseId: string): void {
		if (
			!this.deps.downloadQueue.getJobsForReleaseId(releaseId).every((it) => it.status === DownloadJobStatus.COMPLETED)
		) {
			throw new Error(`Cannot enable release ${releaseId} because not all download jobs are completed.`);
		}

		if (
			!this.deps.extractQueue.getJobsForReleaseId(releaseId).every((it) => it.status === ExtractJobStatus.COMPLETED)
		) {
			throw new Error(`Cannot enable release ${releaseId} because not all extract jobs are completed.`);
		}
	}
}

import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import { err, ok, Result } from "neverthrow";
import type { FileSystem } from "../ports/FileSystem.ts";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import type { MissionScriptingFilesManager } from "./MissionScriptingFilesManager.ts";
import type { DcsPathNotConfigured, PathResolver, PathResolverError } from "./PathResolver.ts";
import type { ReleaseAssetManager } from "./ReleaseAssetManager.ts";
import type { RemoveSymlinksScriptManager } from "./RemoveSymlinksScriptManager.ts";

const logger = getLogger("ReleaseToggle");

type Deps = {
	missionScriptingFilesManager: MissionScriptingFilesManager;
	removeSymlinksScriptManager: RemoveSymlinksScriptManager;
	pathResolver: PathResolver;
	releaseRepository: ReleaseRepository;
	fileSystem: FileSystem;
	releaseAssetManager: ReleaseAssetManager;
};

export class ReleaseToggle {
	constructor(protected deps: Deps) {}

	@Log(logger)
	async enable(releaseId: string): Promise<Result<void, PathResolverError>> {
		logger.info(`Enabling Release ${releaseId}`);
		this.ensureReleaseIsReady(releaseId);

		const links = this.deps.releaseRepository.getSymbolicLinksForRelease(releaseId);
		logger.debug(`Found ${links.length} symbolic links for release ${releaseId}`);

		for (const link of links) {
			const srcAbsResult = this.deps.pathResolver.resolveReleasePath(releaseId, link.src);
			if (srcAbsResult.isErr()) return err(srcAbsResult.error);

			const destAbsResult = this.deps.pathResolver.resolveSymbolicLinkPath(link.destRoot, link.dest);
			if (destAbsResult.isErr()) return err(destAbsResult.error);

			const srcAbs = srcAbsResult.value;
			const destAbs = destAbsResult.value;

			logger.debug(`Creating symlink (release=${releaseId}, linkId=${link.id}, src=${srcAbs}, dest=${destAbs})`);
			await this.deps.fileSystem.ensureSymlink(srcAbs, destAbs);

			this.deps.releaseRepository.setInstalledPathForSymbolicLink(link.id, destAbs);
			logger.debug(`Stored installed symlink path for linkId ${link.id}: ${destAbs}`);
		}

		this.deps.releaseRepository.setEnabled(releaseId, true);

		logger.info(`Rebuilding mission scripting files after enabling release ${releaseId}`);
		const rebuildResult = this.deps.missionScriptingFilesManager.rebuild();
		if (rebuildResult.isErr()) return err(rebuildResult.error);

		logger.info(`Rebuilding remove-symlinks script after enabling release ${releaseId}`);
		const removeSymlinksRebuildResult = this.deps.removeSymlinksScriptManager.rebuild();
		if (removeSymlinksRebuildResult.isErr()) return err(removeSymlinksRebuildResult.error);

		logger.info(`Finished enabling Release ${releaseId}`);
		return ok(undefined);
	}

	@Log(logger)
	disable(releaseId: string): Result<void, DcsPathNotConfigured> {
		logger.info(`Disabling Release ${releaseId}`);

		const links = this.deps.releaseRepository.getSymbolicLinksForRelease(releaseId);
		logger.debug(`Found ${links.length} symbolic links for release ${releaseId}`);

		for (const link of links) {
			if (link.installedPath) {
				logger.debug(`Removing symlink for linkId ${link.id} at ${link.installedPath}`);
				Result.fromThrowable(
					() => this.deps.fileSystem.removeDir(link.installedPath!),
					(e) => (e instanceof Error ? e : new Error(String(e))),
				)().match(
					() => {
						this.deps.releaseRepository.setInstalledPathForSymbolicLink(link.id, null);
						logger.debug(`Cleared installed symlink path for linkId ${link.id}`);
					},
					(e) => {
						logger.error(`Failed to remove path for linkId ${link.id} at ${link.installedPath}: ${e}`);
					},
				);
			} else {
				logger.trace(`Skipping linkId ${link.id} (no installedPath)`);
			}
		}

		this.deps.releaseRepository.setEnabled(releaseId, false);

		logger.info(`Rebuilding mission scripting files after disabling release ${releaseId}`);
		const rebuildResult = this.deps.missionScriptingFilesManager.rebuild();
		if (rebuildResult.isErr()) return err(rebuildResult.error);

		logger.info(`Rebuilding remove-symlinks script after disabling release ${releaseId}`);
		const removeSymlinksRebuildResult = this.deps.removeSymlinksScriptManager.rebuild();
		if (removeSymlinksRebuildResult.isErr()) return err(removeSymlinksRebuildResult.error);

		logger.info(`Finished disabling Release ${releaseId}`);
		return ok(undefined);
	}

	private ensureReleaseIsReady(releaseId: string): void {
		logger.debug(`Checking if release ${releaseId} is ready`);

		if (!this.deps.releaseAssetManager.isReleaseReady(releaseId)) {
			logger.warn(`Release ${releaseId} is not ready: some jobs are incomplete`);
			throw new Error(`Cannot enable release ${releaseId} because not all jobs are completed.`);
		}

		logger.debug(`Release ${releaseId} is ready for activation`);
	}
}

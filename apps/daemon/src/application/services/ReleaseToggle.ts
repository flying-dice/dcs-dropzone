import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import type { FileSystem } from "../ports/FileSystem.ts";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import type { MissionScriptingFilesManager } from "./MissionScriptingFilesManager.ts";
import type { PathResolver, PathResolverError } from "./PathResolver.ts";
import type { ReleaseAssetManager } from "./ReleaseAssetManager.ts";
import type { RemoveSymlinksScriptManager } from "./RemoveSymlinksScriptManager.ts";

export class ReleaseNotFound extends Error {
	readonly type = "ReleaseNotFound" as const;
	constructor(releaseId: string) {
		super(`Release ${releaseId} not found`);
	}
}

export class ReleaseNotReady extends Error {
	readonly type = "ReleaseNotReady" as const;
	constructor(releaseId: string) {
		super(`Cannot enable release ${releaseId} because not all jobs are completed`);
	}
}

export class SymlinkCreationFailed extends Error {
	readonly type = "SymlinkCreationFailed" as const;
}

export class SymlinkRemovalFailed extends Error {
	readonly type = "SymlinkRemovalFailed" as const;
	constructor(linkId: string, cause: unknown) {
		super(`Failed to remove symlink for linkId ${linkId}: ${cause}`);
	}
}

export type ReleaseToggleError = PathResolverError | ReleaseNotFound | ReleaseNotReady | SymlinkCreationFailed;

export type ResolvedSymbolicLink = {
	id: string;
	src: string;
	dest: string;
};

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

	async enable(releaseId: string): Promise<Result<ResolvedSymbolicLink[], ReleaseToggleError>> {
		logger.info(`Enabling Release ${releaseId}`);
		const readyResult = this.checkReleaseIsReady(releaseId);
		if (readyResult.isErr()) return err(readyResult.error);

		const links = this.deps.releaseRepository.getSymbolicLinksForRelease(releaseId);
		logger.debug(`Found ${links.length} symbolic links for release ${releaseId}`);

		const created: ResolvedSymbolicLink[] = [];

		for (const link of links) {
			const srcAbsResult = this.deps.pathResolver.resolveReleasePath(releaseId, link.src);
			if (srcAbsResult.isErr()) {
				this.rollback(created);
				return err(srcAbsResult.error);
			}

			const destAbsResult = this.deps.pathResolver.resolveSymbolicLinkPath(link.destRoot, link.dest);
			if (destAbsResult.isErr()) {
				this.rollback(created);
				return err(destAbsResult.error);
			}

			const srcAbs = srcAbsResult.value;
			const destAbs = destAbsResult.value;

			logger.debug(`Creating symlink (release=${releaseId}, linkId=${link.id}, src=${srcAbs}, dest=${destAbs})`);
			const symlinkResult = await this.deps.fileSystem.ensureSymlink(srcAbs, destAbs);
			if (symlinkResult.isErr()) {
				logger.error(`Failed to create symlink for linkId ${link.id}: ${symlinkResult.error}`);
				this.rollback(created);
				return err(new SymlinkCreationFailed(`Failed to create symlink for ${link.id}: ${symlinkResult.error}`));
			}

			this.deps.releaseRepository.setInstalledPathForSymbolicLink(link.id, destAbs);
			logger.debug(`Stored installed symlink path for linkId ${link.id}: ${destAbs}`);
			created.push({ id: link.id, src: srcAbs, dest: destAbs });
		}

		this.deps.releaseRepository.setEnabled(releaseId, true);

		logger.info(`Rebuilding mission scripting files after enabling release ${releaseId}`);
		const rebuildResult = this.deps.missionScriptingFilesManager.rebuild();
		if (rebuildResult.isErr()) return err(rebuildResult.error);

		logger.info(`Rebuilding remove-symlinks script after enabling release ${releaseId}`);
		const removeSymlinksRebuildResult = this.deps.removeSymlinksScriptManager.rebuild();
		if (removeSymlinksRebuildResult.isErr()) return err(removeSymlinksRebuildResult.error);

		logger.info(`Finished enabling Release ${releaseId}`);
		return ok(created);
	}

	disable(releaseId: string): Result<void, ReleaseToggleError> {
		logger.info(`Disabling Release ${releaseId}`);

		const exists = this.deps.releaseRepository.getById(releaseId) !== undefined;
		if (!exists) {
			logger.warn(`Release ${releaseId} not found`);
			return err(new ReleaseNotFound(releaseId));
		}

		const links = this.deps.releaseRepository.getSymbolicLinksForRelease(releaseId);
		logger.debug(`Found ${links.length} symbolic links for release ${releaseId}`);

		for (const link of links) {
			if (link.installedPath) {
				logger.debug(`Removing symlink for linkId ${link.id} at ${link.installedPath}`);
				try {
					this.deps.fileSystem.removeDir(link.installedPath);
					this.deps.releaseRepository.setInstalledPathForSymbolicLink(link.id, null);
					logger.debug(`Cleared installed symlink path for linkId ${link.id}`);
				} catch (e) {
					logger.error(`Failed to remove path for linkId ${link.id} at ${link.installedPath}: ${e}`);
				}
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

	private rollback(created: ResolvedSymbolicLink[]): void {
		logger.warn(`Rolling back ${created.length} created symlinks`);
		for (const link of created) {
			try {
				this.deps.fileSystem.removeDir(link.dest);
				this.deps.releaseRepository.setInstalledPathForSymbolicLink(link.id, null);
				logger.debug(`Rolled back symlink for linkId ${link.id} at ${link.dest}`);
			} catch (e) {
				logger.error(`Failed to rollback symlink for linkId ${link.id} at ${link.dest}: ${e}`);
			}
		}
	}

	private checkReleaseIsReady(releaseId: string): Result<void, ReleaseNotFound | ReleaseNotReady> {
		logger.debug(`Checking if release ${releaseId} is ready`);

		const exists = this.deps.releaseRepository.getById(releaseId) !== undefined;
		if (!exists) {
			logger.warn(`Release ${releaseId} not found`);
			return err(new ReleaseNotFound(releaseId));
		}

		if (!this.deps.releaseAssetManager.isReleaseReady(releaseId)) {
			logger.warn(`Release ${releaseId} is not ready: some jobs are incomplete`);
			return err(new ReleaseNotReady(releaseId));
		}

		logger.debug(`Release ${releaseId} is ready for activation`);
		return ok(undefined);
	}
}

import { type LinkDefinition, type Linker, type LinkerError, SymlinkCreationFailed } from "@packages/linker";
import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import type { MissionScriptingFilesManager } from "./MissionScriptingFilesManager.ts";
import type { DcsPathNotConfigured, PathResolver, PathResolverError } from "./PathResolver.ts";
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

export { SymlinkCreationFailed };

export type ReleaseToggleError = PathResolverError | LinkerError | ReleaseNotFound | ReleaseNotReady;

const logger = getLogger("ReleaseToggle");

type Deps = {
	missionScriptingFilesManager: MissionScriptingFilesManager;
	removeSymlinksScriptManager: RemoveSymlinksScriptManager;
	pathResolver: PathResolver;
	releaseRepository: ReleaseRepository;
	linker: Linker;
	releaseAssetManager: ReleaseAssetManager;
};

export class ReleaseToggle {
	constructor(protected deps: Deps) {}

	async enable(releaseId: string): Promise<Result<void, ReleaseToggleError>> {
		logger.info(`Enabling Release ${releaseId}`);
		const readyResult = this.checkReleaseIsReady(releaseId);
		if (readyResult.isErr()) return err(readyResult.error);

		const links = this.deps.releaseRepository.getSymbolicLinksForRelease(releaseId);
		logger.debug(`Found ${links.length} symbolic links for release ${releaseId}`);

		const linkDefinitions: LinkDefinition[] = [];

		for (const link of links) {
			const srcAbsResult = this.deps.pathResolver.resolveReleasePath(releaseId, link.src);
			if (srcAbsResult.isErr()) return err(srcAbsResult.error);

			const destAbsResult = this.deps.pathResolver.resolveSymbolicLinkPath(link.destRoot, link.dest);
			if (destAbsResult.isErr()) return err(destAbsResult.error);

			linkDefinitions.push({ id: link.id, src: srcAbsResult.value, dest: destAbsResult.value });
		}

		const linkerResult = await this.deps.linker.enable(linkDefinitions);
		if (linkerResult.isErr()) return err(linkerResult.error);

		for (const resolved of linkerResult.value) {
			this.deps.releaseRepository.setInstalledPathForSymbolicLink(resolved.id, resolved.dest);
			logger.debug(`Stored installed symlink path for linkId ${resolved.id}: ${resolved.dest}`);
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

	disable(releaseId: string): Result<void, ReleaseNotFound | DcsPathNotConfigured> {
		logger.info(`Disabling Release ${releaseId}`);

		const exists = this.deps.releaseRepository.getById(releaseId) !== undefined;
		if (!exists) {
			logger.warn(`Release ${releaseId} not found`);
			return err(new ReleaseNotFound(releaseId));
		}

		const links = this.deps.releaseRepository.getSymbolicLinksForRelease(releaseId);
		logger.debug(`Found ${links.length} symbolic links for release ${releaseId}`);

		const installedLinks = links
			.filter((link) => link.installedPath !== null)
			.map((link) => ({ id: link.id, installedPath: link.installedPath! }));

		const linkerResult = this.deps.linker.disable(installedLinks);
		const removedIds = linkerResult.isOk() ? linkerResult.value : linkerResult.error.removed;

		if (linkerResult.isErr()) {
			for (const failure of linkerResult.error.failed) {
				logger.warn(`Could not remove symlink (linkId=${failure.linkId}): ${failure.message}`);
			}
		}

		for (const id of removedIds) {
			this.deps.releaseRepository.setInstalledPathForSymbolicLink(id, null);
			logger.debug(`Cleared installed symlink path for linkId ${id}`);
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

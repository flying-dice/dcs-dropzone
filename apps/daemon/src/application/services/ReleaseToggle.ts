import { type LinkDefinition, type Linker, type LinkerError, SymlinkCreationFailed } from "@packages/linker";
import { getLogger } from "log4js";
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

	async enable(releaseId: string): Promise<[void, null] | [undefined, ReleaseToggleError]> {
		logger.info(`Enabling Release ${releaseId}`);
		const [, readyErr] = this.checkReleaseIsReady(releaseId);
		if (readyErr) return [undefined, readyErr] as const;

		const links = this.deps.releaseRepository.getSymbolicLinksForRelease(releaseId);
		logger.debug(`Found ${links.length} symbolic links for release ${releaseId}`);

		const linkDefinitions: LinkDefinition[] = [];

		for (const link of links) {
			const [srcAbs, srcAbsErr] = this.deps.pathResolver.resolveReleasePath(releaseId, link.src);
			if (srcAbsErr) return [undefined, srcAbsErr] as const;

			const [destAbs, destAbsErr] = this.deps.pathResolver.resolveSymbolicLinkPath(link.destRoot, link.dest);
			if (destAbsErr) return [undefined, destAbsErr] as const;

			linkDefinitions.push({ id: link.id, src: srcAbs, dest: destAbs });
		}

		const [resolvedLinks, linkerErr] = await this.deps.linker.enable(linkDefinitions);
		if (linkerErr) return [undefined, linkerErr] as const;

		for (const resolved of resolvedLinks) {
			this.deps.releaseRepository.setInstalledPathForSymbolicLink(resolved.id, resolved.dest);
			logger.debug(`Stored installed symlink path for linkId ${resolved.id}: ${resolved.dest}`);
		}

		this.deps.releaseRepository.setEnabled(releaseId, true);

		logger.info(`Rebuilding mission scripting files after enabling release ${releaseId}`);
		const [, rebuildErr] = this.deps.missionScriptingFilesManager.rebuild();
		if (rebuildErr) return [undefined, rebuildErr] as const;

		logger.info(`Rebuilding remove-symlinks script after enabling release ${releaseId}`);
		const [, removeSymlinksRebuildErr] = this.deps.removeSymlinksScriptManager.rebuild();
		if (removeSymlinksRebuildErr) return [undefined, removeSymlinksRebuildErr] as const;

		logger.info(`Finished enabling Release ${releaseId}`);
		return [undefined, null];
	}

	disable(releaseId: string): [void, null] | [undefined, ReleaseNotFound | DcsPathNotConfigured] {
		logger.info(`Disabling Release ${releaseId}`);

		const exists = this.deps.releaseRepository.getById(releaseId) !== undefined;
		if (!exists) {
			logger.warn(`Release ${releaseId} not found`);
			return [undefined, new ReleaseNotFound(releaseId)];
		}

		const links = this.deps.releaseRepository.getSymbolicLinksForRelease(releaseId);
		logger.debug(`Found ${links.length} symbolic links for release ${releaseId}`);

		const installedLinks = links
			.filter((link) => link.installedPath !== null)
			.map((link) => ({ id: link.id, installedPath: link.installedPath! }));

		const [removedOk, linkerErr] = this.deps.linker.disable(installedLinks);
		const removedIds = removedOk ?? linkerErr?.removed ?? [];

		if (linkerErr) {
			for (const failure of linkerErr.failed) {
				logger.warn(`Could not remove symlink (linkId=${failure.linkId}): ${failure.message}`);
			}
		}

		for (const id of removedIds) {
			this.deps.releaseRepository.setInstalledPathForSymbolicLink(id, null);
			logger.debug(`Cleared installed symlink path for linkId ${id}`);
		}

		this.deps.releaseRepository.setEnabled(releaseId, false);

		logger.info(`Rebuilding mission scripting files after disabling release ${releaseId}`);
		const [, rebuildErr] = this.deps.missionScriptingFilesManager.rebuild();
		if (rebuildErr) return [undefined, rebuildErr] as const;

		logger.info(`Rebuilding remove-symlinks script after disabling release ${releaseId}`);
		const [, removeSymlinksRebuildErr] = this.deps.removeSymlinksScriptManager.rebuild();
		if (removeSymlinksRebuildErr) return [undefined, removeSymlinksRebuildErr] as const;

		logger.info(`Finished disabling Release ${releaseId}`);
		return [undefined, null];
	}

	private checkReleaseIsReady(releaseId: string): [void, null] | [undefined, ReleaseNotFound | ReleaseNotReady] {
		logger.debug(`Checking if release ${releaseId} is ready`);

		const exists = this.deps.releaseRepository.getById(releaseId) !== undefined;
		if (!exists) {
			logger.warn(`Release ${releaseId} not found`);
			return [undefined, new ReleaseNotFound(releaseId)];
		}

		if (!this.deps.releaseAssetManager.isReleaseReady(releaseId)) {
			logger.warn(`Release ${releaseId} is not ready: some jobs are incomplete`);
			return [undefined, new ReleaseNotReady(releaseId)];
		}

		logger.debug(`Release ${releaseId} is ready for activation`);
		return [undefined, null];
	}
}

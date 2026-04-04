import type { LinkDefinition, Linker } from "@packages/linker";
import { getLogger } from "log4js";
import type { EnableReleaseError, DisableReleaseError, ToggleReleaseError } from "../schemas/ToggleErrors.ts";
import type { ReleaseRepository } from "../ports/ReleaseRepository.ts";
import type { MissionScriptingFilesManager } from "./MissionScriptingFilesManager.ts";
import type { DcsPathError, PathResolver } from "./PathResolver.ts";
import type { ReleaseAssetManager } from "./ReleaseAssetManager.ts";
import type { RemoveSymlinksScriptManager } from "./RemoveSymlinksScriptManager.ts";

export type { EnableReleaseError, DisableReleaseError, ToggleReleaseError };

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

	async enable(releaseId: string): Promise<[void, null] | [undefined, EnableReleaseError]> {
		logger.info(`Enabling Release ${releaseId}`);
		const readyErr = this.checkReleaseIsReady(releaseId);
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
		if (linkerErr) {
			return [
				undefined,
				{
					reason: "SymlinkCreationFailed" as const,
					errorCode: linkerErr.code,
					systemError: linkerErr.message,
				},
			];
		}

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

	disable(releaseId: string): [void, null] | [undefined, DisableReleaseError] {
		logger.info(`Disabling Release ${releaseId}`);

		const exists = this.deps.releaseRepository.getById(releaseId) !== undefined;
		if (!exists) {
			logger.warn(`Release ${releaseId} not found`);
			return [undefined, { reason: "ReleaseNotFound" as const }];
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

			for (const id of removedIds) {
				this.deps.releaseRepository.setInstalledPathForSymbolicLink(id, null);
			}

			this.deps.releaseRepository.setEnabled(releaseId, false);

			return [
				undefined,
				{
					reason: "PartialDisableFailure" as const,
					removedCount: removedIds.length,
					failedCount: linkerErr.failed.length,
					systemError: linkerErr.failed.map((f) => f.message).join("; "),
				},
			];
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

	private checkReleaseIsReady(
		releaseId: string,
	): EnableReleaseError | undefined {
		logger.debug(`Checking if release ${releaseId} is ready`);

		const exists = this.deps.releaseRepository.getById(releaseId) !== undefined;
		if (!exists) {
			logger.warn(`Release ${releaseId} not found`);
			return { reason: "ReleaseNotFound" as const };
		}

		const readiness = this.deps.releaseAssetManager.getReleaseReadiness(releaseId);
		if (!readiness.ready) {
			logger.warn(`Release ${releaseId} is not ready: some jobs are incomplete`);
			return {
				reason: "ReleaseNotReady" as const,
				pendingCount: readiness.pendingCount,
				failedCount: readiness.failedCount,
			};
		}

		logger.debug(`Release ${releaseId} is ready for activation`);
		return undefined;
	}
}

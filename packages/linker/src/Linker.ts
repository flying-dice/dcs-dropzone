import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import type { LinkerError } from "./errors.ts";
import { SymlinkCreationFailed } from "./errors.ts";
import type { LinkerFileSystem } from "./LinkerFileSystem.ts";
import type { LinkDefinition, ResolvedLink } from "./types.ts";

const logger = getLogger("Linker");

type Deps = {
	fileSystem: LinkerFileSystem;
};

/**
 * The Linker is responsible for creating and removing symbolic links on disk.
 *
 * - **enable**: Takes a series of link definitions, creates symlinks for each, and returns
 *   the resolved links with actual locations. On any failure, all previously created
 *   symlinks are rolled back.
 *
 * - **disable**: Takes a series of installed link paths and removes them from disk.
 *   Individual removal failures are logged but do not prevent other links from being processed.
 */
export class Linker {
	constructor(protected deps: Deps) {}

	/**
	 * Creates symlinks for all provided link definitions.
	 *
	 * @param links - Link definitions with absolute src and dest paths.
	 * @returns On success, the resolved links with actual paths. On failure, all created
	 *          symlinks are rolled back and an error is returned.
	 */
	async enable(links: LinkDefinition[]): Promise<Result<ResolvedLink[], LinkerError>> {
		logger.info(`Creating ${links.length} symbolic links`);
		const created: ResolvedLink[] = [];

		for (const link of links) {
			logger.debug(`Creating symlink (linkId=${link.id}, src=${link.src}, dest=${link.dest})`);
			const symlinkResult = await this.deps.fileSystem.ensureSymlink(link.src, link.dest);
			if (symlinkResult.isErr()) {
				logger.error(`Failed to create symlink for linkId ${link.id}: ${symlinkResult.error}`);
				this.rollback(created);
				return err(new SymlinkCreationFailed(`Failed to create symlink for ${link.id}: ${symlinkResult.error}`));
			}

			created.push({ id: link.id, src: link.src, dest: link.dest });
			logger.debug(`Created symlink for linkId ${link.id}`);
		}

		logger.info(`Successfully created ${created.length} symbolic links`);
		return ok(created);
	}

	/**
	 * Removes symlinks at the provided installed paths.
	 * Individual removal failures are logged but do not prevent other links from being removed.
	 *
	 * @param links - Array of objects with link id and installed path to remove.
	 * @returns Array of link IDs that were successfully removed.
	 */
	disable(links: { id: string; installedPath: string }[]): string[] {
		logger.info(`Removing ${links.length} symbolic links`);
		const removed: string[] = [];

		for (const link of links) {
			logger.debug(`Removing symlink for linkId ${link.id} at ${link.installedPath}`);
			try {
				this.deps.fileSystem.removeDir(link.installedPath);
				removed.push(link.id);
				logger.debug(`Removed symlink for linkId ${link.id}`);
			} catch (e) {
				logger.error(`Failed to remove symlink for linkId ${link.id} at ${link.installedPath}: ${e}`);
			}
		}

		logger.info(`Finished removing symbolic links (${removed.length}/${links.length} succeeded)`);
		return removed;
	}

	private rollback(created: ResolvedLink[]): void {
		logger.warn(`Rolling back ${created.length} created symlinks`);
		for (const link of created) {
			try {
				this.deps.fileSystem.removeDir(link.dest);
				logger.debug(`Rolled back symlink for linkId ${link.id} at ${link.dest}`);
			} catch (e) {
				logger.error(`Failed to rollback symlink for linkId ${link.id} at ${link.dest}: ${e}`);
			}
		}
	}
}

import { lstatSync, mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { getLogger } from "log4js";
import { err, fromThrowable, ok, type Result } from "neverthrow";
import type { LinkerError } from "./errors.ts";
import { LinkerErrorCode, RemovalFailed, SymlinkCreationFailed } from "./errors.ts";
import { mklink } from "./mklink.ts";
import type { LinkDefinition, ResolvedLink } from "./types.ts";

const logger = getLogger("Linker");

/**
 * The Linker is responsible for creating and removing symbolic links on disk.
 *
 * - **enable**: Takes a series of link definitions with absolute paths, creates symlinks
 *   for each, and returns the resolved links. On any failure, all previously created
 *   symlinks are rolled back and a detailed error with code is returned.
 *
 * - **disable**: Removes installed symlinks. Returns IDs of successfully removed links.
 *   Individual removal failures are logged but do not prevent other removals.
 */
export class Linker {
	/**
	 * Creates symlinks for all provided link definitions.
	 * If any link fails, all previously created links are rolled back.
	 *
	 * @param links - Link definitions with absolute src and dest paths.
	 * @returns On success, the resolved links. On failure, all links are rolled back and
	 *          a {@link SymlinkCreationFailed} error with a {@link LinkerErrorCode} is returned.
	 */
	async enable(links: LinkDefinition[]): Promise<Result<ResolvedLink[], LinkerError>> {
		logger.info(`Creating ${links.length} symbolic links`);
		const created: ResolvedLink[] = [];

		for (const link of links) {
			const result = await this.createLink(link);
			if (result.isErr()) {
				this.rollback(created);
				return err(result.error);
			}
			created.push(result.value);
		}

		logger.info(`Successfully created ${created.length} symbolic links`);
		return ok(created);
	}

	/**
	 * Removes symlinks at the provided installed paths.
	 * All links are attempted regardless of individual failures.
	 *
	 * @param links - Array of objects with link id and installed path to remove.
	 * @returns On full success, the IDs of all removed links. On partial/total failure,
	 *          an object with the successfully removed IDs and the structured failures.
	 */
	disable(
		links: { id: string; installedPath: string }[],
	): Result<string[], { removed: string[]; failed: RemovalFailed[] }> {
		logger.info(`Removing ${links.length} symbolic links`);
		const removed: string[] = [];
		const failed: RemovalFailed[] = [];

		const _rmSync = fromThrowable(rmSync, (e) => (e instanceof Error ? e : new Error(String(e))));

		for (const link of links) {
			logger.debug(`Removing symlink for linkId ${link.id} at ${link.installedPath}`);

			if (!lstatSync(link.installedPath, { throwIfNoEntry: false })) {
				removed.push(link.id);
				logger.debug(`Symlink already absent for linkId ${link.id}, treating as removed`);
				continue;
			}

			const result = _rmSync(link.installedPath, { force: true, recursive: true });
			if (result.isOk()) {
				removed.push(link.id);
				logger.debug(`Removed symlink for linkId ${link.id}`);
			} else {
				failed.push(new RemovalFailed(link.id, result.error.message));
				logger.error(
					`Failed to remove symlink for linkId ${link.id} at ${link.installedPath}: ${result.error.message}`,
				);
			}
		}

		logger.info(`Finished removing symbolic links (${removed.length}/${links.length} succeeded)`);
		return failed.length > 0 ? err({ removed, failed }) : ok(removed);
	}

	private async createLink(link: LinkDefinition): Promise<Result<ResolvedLink, SymlinkCreationFailed>> {
		logger.debug(`Creating symlink (linkId=${link.id}, src=${link.src}, dest=${link.dest})`);

		if (!lstatSync(link.src, { throwIfNoEntry: false })) {
			return err(
				new SymlinkCreationFailed(link.id, LinkerErrorCode.SourceNotFound, `Source path does not exist: ${link.src}`),
			);
		}

		try {
			const parent = dirname(link.dest);
			if (!lstatSync(parent, { throwIfNoEntry: false })) {
				mkdirSync(parent, { recursive: true });
			}
		} catch (e) {
			return err(
				new SymlinkCreationFailed(
					link.id,
					LinkerErrorCode.LinkCreationFailed,
					`Failed to create parent directory for dest: ${e}`,
				),
			);
		}

		if (lstatSync(link.dest, { throwIfNoEntry: false })) {
			return err(
				new SymlinkCreationFailed(
					link.id,
					LinkerErrorCode.LinkAlreadyExists,
					`Destination path already exists: ${link.dest}`,
				),
			);
		}

		const result = await mklink({ link: link.dest, target: link.src });
		if (result.isErr()) {
			const [, message] = result.error;

			const code =
				message.toLowerCase().includes("eperm") || message.toLowerCase().includes("permission")
					? LinkerErrorCode.PermissionDenied
					: LinkerErrorCode.LinkCreationFailed;

			return err(new SymlinkCreationFailed(link.id, code, message));
		}

		logger.debug(`Created symlink for linkId ${link.id}`);
		return ok({ id: link.id, src: link.src, dest: link.dest });
	}

	private rollback(created: ResolvedLink[]): void {
		logger.warn(`Rolling back ${created.length} created symlinks`);
		for (const link of created) {
			try {
				if (lstatSync(link.dest, { throwIfNoEntry: false })) {
					rmSync(link.dest, { force: true, recursive: true });
				}
				logger.debug(`Rolled back symlink for linkId ${link.id} at ${link.dest}`);
			} catch (e) {
				logger.error(`Failed to rollback symlink for linkId ${link.id} at ${link.dest}: ${e}`);
			}
		}
	}
}

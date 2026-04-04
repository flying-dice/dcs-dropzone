import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import type { LinkerError } from "./errors.ts";
import { LinkerErrorCode, SymlinkCreationFailed } from "./errors.ts";
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
	 * Individual removal failures are logged but do not prevent other removals.
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
				if (existsSync(link.installedPath)) {
					rmSync(link.installedPath, { force: true, recursive: true });
				}
				removed.push(link.id);
				logger.debug(`Removed symlink for linkId ${link.id}`);
			} catch (e) {
				logger.error(`Failed to remove symlink for linkId ${link.id} at ${link.installedPath}: ${e}`);
			}
		}

		logger.info(`Finished removing symbolic links (${removed.length}/${links.length} succeeded)`);
		return removed;
	}

	private async createLink(link: LinkDefinition): Promise<Result<ResolvedLink, SymlinkCreationFailed>> {
		logger.debug(`Creating symlink (linkId=${link.id}, src=${link.src}, dest=${link.dest})`);

		if (!existsSync(link.src)) {
			return err(
				new SymlinkCreationFailed(link.id, LinkerErrorCode.SourceNotFound, `Source path does not exist: ${link.src}`),
			);
		}

		try {
			const parent = dirname(link.dest);
			if (!existsSync(parent)) {
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

		if (existsSync(link.dest)) {
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
				if (existsSync(link.dest)) {
					rmSync(link.dest, { force: true, recursive: true });
				}
				logger.debug(`Rolled back symlink for linkId ${link.id} at ${link.dest}`);
			} catch (e) {
				logger.error(`Failed to rollback symlink for linkId ${link.id} at ${link.dest}: ${e}`);
			}
		}
	}
}

import { lstatSync, mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { getLogger } from "log4js";
import type { LinkerError } from "./errors.ts";
import { LinkerErrorCode, RemovalFailed, SymlinkCreationFailed } from "./errors.ts";
import { mklink } from "./mklink.ts";
import type { LinkDefinition, ResolvedLink } from "./types.ts";

const logger = getLogger("Linker");

function safeLstat(path: string): [ReturnType<typeof lstatSync> | undefined, null] | [undefined, Error] {
	try {
		return [lstatSync(path, { throwIfNoEntry: false }), null];
	} catch (e) {
		return [undefined, e instanceof Error ? e : new Error(String(e))];
	}
}

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
	 * @returns On success, `[ResolvedLink[], null]`. On failure, all links are rolled back and
	 *          `[undefined, SymlinkCreationFailed]` is returned.
	 */
	async enable(links: LinkDefinition[]): Promise<[ResolvedLink[], null] | [undefined, LinkerError]> {
		logger.info(`Creating ${links.length} symbolic links`);
		const created: ResolvedLink[] = [];

		for (const link of links) {
			const [resolved, createErr] = await this.createLink(link);
			if (createErr) {
				this.rollback(created);
				return [undefined, createErr];
			}
			created.push(resolved);
		}

		logger.info(`Successfully created ${created.length} symbolic links`);
		return [created, null];
	}

	/**
	 * Removes symlinks at the provided installed paths.
	 * All links are attempted regardless of individual failures.
	 *
	 * @param links - Array of objects with link id and installed path to remove.
	 * @returns On full success, `[string[], null]` with the IDs of all removed links.
	 *          On partial/total failure, `[undefined, { removed, failed }]`.
	 */
	disable(
		links: { id: string; installedPath: string }[],
	): [string[], null] | [undefined, { removed: string[]; failed: RemovalFailed[] }] {
		logger.info(`Removing ${links.length} symbolic links`);
		const removed: string[] = [];
		const failed: RemovalFailed[] = [];

		for (const link of links) {
			logger.debug(`Removing symlink for linkId ${link.id} at ${link.installedPath}`);

			const [statValue, statErr] = safeLstat(link.installedPath);
			if (statErr) {
				failed.push(new RemovalFailed(link.id, `Cannot stat path: ${statErr.message}`));
				logger.error(`Failed to stat path for linkId ${link.id}: ${statErr.message}`);
				continue;
			}
			if (!statValue) {
				removed.push(link.id);
				logger.debug(`Symlink already absent for linkId ${link.id}, treating as removed`);
				continue;
			}

			try {
				rmSync(link.installedPath, { force: true, recursive: true });
				removed.push(link.id);
				logger.debug(`Removed symlink for linkId ${link.id}`);
			} catch (e) {
				const message = e instanceof Error ? e.message : String(e);
				failed.push(new RemovalFailed(link.id, message));
				logger.error(`Failed to remove symlink for linkId ${link.id} at ${link.installedPath}: ${message}`);
			}
		}

		logger.info(`Finished removing symbolic links (${removed.length}/${links.length} succeeded)`);
		return failed.length > 0 ? [undefined, { removed, failed }] : [removed, null];
	}

	private async createLink(link: LinkDefinition): Promise<[ResolvedLink, null] | [undefined, SymlinkCreationFailed]> {
		logger.debug(`Creating symlink (linkId=${link.id}, src=${link.src}, dest=${link.dest})`);

		const [srcStat, srcStatErr] = safeLstat(link.src);
		if (srcStatErr || !srcStat) {
			return [
				undefined,
				new SymlinkCreationFailed(link.id, LinkerErrorCode.SourceNotFound, `Source path does not exist: ${link.src}`),
			];
		}

		try {
			const parent = dirname(link.dest);
			const [parentStat, parentStatErr] = safeLstat(parent);
			if (parentStatErr || !parentStat) {
				mkdirSync(parent, { recursive: true });
			}
		} catch (e) {
			return [
				undefined,
				new SymlinkCreationFailed(
					link.id,
					LinkerErrorCode.LinkCreationFailed,
					`Failed to create parent directory for dest: ${e}`,
				),
			];
		}

		const [destStat, destStatErr] = safeLstat(link.dest);
		if (destStatErr) {
			return [
				undefined,
				new SymlinkCreationFailed(
					link.id,
					LinkerErrorCode.PermissionDenied,
					`Cannot access destination path: ${destStatErr.message}`,
				),
			];
		}
		if (destStat) {
			return [
				undefined,
				new SymlinkCreationFailed(
					link.id,
					LinkerErrorCode.LinkAlreadyExists,
					`Destination path already exists: ${link.dest}`,
				),
			];
		}

		const [, mklinkErr] = await mklink({ link: link.dest, target: link.src });
		if (mklinkErr) {
			const [, message] = mklinkErr;

			const code =
				message.toLowerCase().includes("eperm") || message.toLowerCase().includes("permission")
					? LinkerErrorCode.PermissionDenied
					: LinkerErrorCode.LinkCreationFailed;

			return [undefined, new SymlinkCreationFailed(link.id, code, message)];
		}

		logger.debug(`Created symlink for linkId ${link.id}`);
		return [{ id: link.id, src: link.src, dest: link.dest }, null];
	}

	private rollback(created: ResolvedLink[]): void {
		logger.warn(`Rolling back ${created.length} created symlinks`);
		for (const link of created) {
			try {
				const [stat] = safeLstat(link.dest);
				if (stat) {
					rmSync(link.dest, { force: true, recursive: true });
				}
				logger.debug(`Rolled back symlink for linkId ${link.id} at ${link.dest}`);
			} catch (e) {
				logger.error(`Failed to rollback symlink for linkId ${link.id} at ${link.dest}: ${e}`);
			}
		}
	}
}

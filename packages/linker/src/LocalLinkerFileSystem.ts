import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import type { LinkerFileSystem } from "./LinkerFileSystem.ts";
import { mklink } from "./mklink.ts";

const logger = getLogger("LocalLinkerFileSystem");

/**
 * Production implementation of {@link LinkerFileSystem} that creates real symlinks on disk.
 * Handles parent directory creation and delegates to {@link mklink} for platform-specific
 * link creation (including UAC elevation on Windows).
 */
export class LocalLinkerFileSystem implements LinkerFileSystem {
	async ensureSymlink(src: string, dest: string): Promise<Result<void, Error>> {
		logger.debug(`Ensuring symlink from ${dest} to ${src}`);
		const parent = dirname(dest);

		if (!existsSync(parent)) {
			logger.debug(`Creating parent directory: ${parent}`);
			mkdirSync(parent, { recursive: true });
		}

		logger.debug(`Creating link from ${dest} to ${src}`);
		const res = await mklink({ link: dest, target: src });
		if (res.isErr()) {
			const [, message] = res.error;
			logger.error(`Failed to create symlink: ${message}`);
			return err(new Error(`Failed to create symlink from ${dest} to ${src}: ${message}`));
		}

		return ok(undefined);
	}

	removeDir(path: string): void {
		logger.debug(`Removing directory at path: ${path}`);
		if (existsSync(path)) {
			logger.debug(`Directory exists. Removing directory at path: ${path}`);
			rmSync(path, { force: true, recursive: true });
		} else {
			logger.debug(`Directory does not exist at path: ${path}. No action taken.`);
		}
	}

	resolve(...paths: string[]): string {
		return resolve(...paths);
	}

	exists(path: string): Result<boolean, Error> {
		try {
			return ok(existsSync(path));
		} catch (e) {
			if (e instanceof Error) return err(e);
			return err(new Error(String(e)));
		}
	}
}

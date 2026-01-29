import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import type { FileSystem } from "../application/ports/FileSystem.ts";
import { mklink } from "../utils/mklink.ts";

const logger = getLogger("LocalFileSystemService");

export class LocalFileSystem implements FileSystem {
	@Log(logger)
	ensureDir(path: string): void {
		logger.debug(`Ensuring directory exists at path: ${path}`);
		if (!existsSync(path)) {
			logger.debug(`Directory does not exist. Creating directory at path: ${path}`);
			mkdirSync(path, { recursive: true });
		} else {
			logger.debug(`Directory already exists at path: ${path}`);
		}
	}

	@Log(logger)
	async ensureSymlink(src: string, dest: string): Promise<void> {
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
			throw new Error(`Failed to create symlink from ${dest} to ${src}: ${message}`);
		}
	}

	@Log(logger)
	removeDir(path: string): void {
		logger.debug(`Removing directory at path: ${path}`);
		if (existsSync(path)) {
			logger.debug(`Directory exists. Removing directory at path: ${path}`);
			rmSync(path, { force: true, recursive: true });
		} else {
			logger.debug(`Directory does not exist at path: ${path}. No action taken.`);
		}
	}

	@Log(logger)
	writeFile(filePath: string, content: string): void {
		logger.debug(`Writing file at path: ${filePath}`);
		const parent = dirname(filePath);

		logger.debug(`Ensuring parent directory exists at path: ${parent}`);
		if (!existsSync(parent)) {
			logger.debug(`Parent directory does not exist. Creating directory at path: ${parent}`);
			mkdirSync(parent, { recursive: true });
		}

		logger.debug(`Writing content to file at path: ${filePath}`);
		writeFileSync(filePath, content);
	}

	@Log(logger)
	resolve(...paths: string[]): string {
		return resolve(...paths);
	}

	@Log(logger)
	glob(path: string, pattern: string): string[] {
		const glob = new Bun.Glob(join(path, pattern));
		return Array.from(glob.scanSync({ followSymlinks: true }));
	}
}

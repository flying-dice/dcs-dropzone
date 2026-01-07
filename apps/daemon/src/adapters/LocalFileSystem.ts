import {
	existsSync,
	lstatSync,
	mkdirSync,
	type PathLike,
	readlinkSync,
	rmSync,
	symlinkSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import type { FileSystem } from "../application/ports/FileSystem.ts";

const logger = getLogger("LocalFileSystemService");

type SymlinkType = "dir" | "file" | "junction";

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
	ensureSymlink(src: string, dest: string): void {
		logger.debug(`Ensuring symlink from ${dest} to ${src}`);
		const type = this.getSymlinkType(src);
		const parent = dirname(dest);

		if (!existsSync(parent)) {
			logger.debug(`Creating parent directory: ${parent}`);
			mkdirSync(parent, { recursive: true });
		}

		if (existsSync(dest)) {
			logger.debug(`Destination exists: ${dest}, checking if it's the correct symlink`);
			try {
				const current = lstatSync(dest);
				if (current.isSymbolicLink()) {
					const pointsTo = readlinkSync(dest);
					if (pointsTo === src) {
						logger.debug(`Symlink already exists and points to the correct source: ${pointsTo}`);
						return;
					}
				}
			} catch {
				logger.debug(`Failed to read existing symlink at destination: ${dest}, will replace it`);
			}

			logger.debug(`Removing existing destination: ${dest}`);
			unlinkSync(dest);
		}

		logger.debug(`Creating symlink from ${dest} to ${src} of type ${type}`);
		symlinkSync(src, dest, type);
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

	private getSymlinkType(pathlike: PathLike): SymlinkType {
		const srcStat = lstatSync(pathlike);
		const isDir = srcStat.isDirectory();
		return process.platform === "win32" && isDir ? "junction" : isDir ? "dir" : "file";
	}
}

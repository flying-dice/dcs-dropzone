import { resolve } from "node:path";
import { err, ok } from "neverthrow";
import type { LinkerFileSystem } from "../LinkerFileSystem.ts";

/**
 * In-memory implementation of {@link LinkerFileSystem} for testing.
 * Tracks created symlinks and allows simulating symlink creation errors.
 */
export class TestLinkerFileSystem implements LinkerFileSystem {
	private readonly dirs = new Set<string>();
	private readonly symlinks = new Map<string, string>();

	symlinkError: Error | null = null;

	async ensureSymlink(src: string, dest: string) {
		if (this.symlinkError) {
			return err(this.symlinkError);
		}
		this.symlinks.set(dest, src);
		return ok(undefined);
	}

	removeDir(path: string): void {
		this.dirs.forEach((dir) => {
			if (dir === path || dir.startsWith(`${path}/`)) {
				this.dirs.delete(dir);
			}
		});

		Array.from(this.symlinks.keys()).forEach((link) => {
			if (link === path || link.startsWith(`${path}/`)) {
				this.symlinks.delete(link);
			}
		});
	}

	resolve(...paths: string[]): string {
		return resolve(...paths);
	}

	exists(path: string) {
		return ok(this.dirs.has(path) || this.symlinks.has(path));
	}

	hasSymlink(linkPath: string): boolean {
		return this.symlinks.has(linkPath);
	}
}

import type { FileSystem } from "../application/ports/FileSystem.ts";

export class TestFileSystem implements FileSystem {
	private readonly files = new Map<string, string>();
	private readonly dirs = new Set<string>();
	private readonly symlinks = new Map<string, string>();

	ensureDir(path: string): void {
		this.dirs.add(path);
	}

	ensureSymlink(src: string, dest: string): void {
		this.symlinks.set(dest, src);
	}

	removeDir(path: string): void {
		this.dirs.forEach((dir) => {
			if (dir === path || dir.startsWith(`${path}/`)) {
				this.dirs.delete(dir);
			}
		});

		Array.from(this.files.keys()).forEach((file) => {
			if (file.startsWith(`${path}/`)) {
				this.files.delete(file);
			}
		});

		Array.from(this.symlinks.keys()).forEach((link) => {
			if (link.startsWith(`${path}/`)) {
				this.symlinks.delete(link);
			}
		});
	}

	writeFile(filePath: string, content: string): void {
		this.files.set(filePath, content);
	}

	resolve(...paths: string[]): string {
		return paths.join("/");
	}

	glob(path: string, pattern: string): string[] {
		const glob = new Bun.Glob(pattern);

		const files: string[] = [];

		for (const file of this.files.keys()) {
			if (file.startsWith(path) && glob.match(file)) {
				files.push(file);
			}
		}

		for (const symlink of this.symlinks.keys()) {
			if (symlink.startsWith(path) && glob.match(symlink)) {
				files.push(symlink);
			}
		}

		return files;
	}

	hasSymlink(linkPath: string): boolean {
		return this.symlinks.has(linkPath);
	}

	hasFile(filePath: string): boolean {
		return this.files.has(filePath);
	}

	getFileContent(filePath: string): string | undefined {
		return this.files.get(filePath);
	}

	hasDir(dirPath: string): boolean {
		return this.dirs.has(dirPath);
	}
}

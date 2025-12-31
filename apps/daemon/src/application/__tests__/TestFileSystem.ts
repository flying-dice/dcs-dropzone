import type { FileSystem } from "../ports/FileSystem.ts";

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
}

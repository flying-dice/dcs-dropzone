import type { FileSystem } from "../FileSystem.ts";

export class TestFileSystem implements FileSystem {
	public ensuredDirs: string[] = [];
	public writtenFiles: Map<string, string> = new Map();
	public removedDirs: string[] = [];
	public createdSymlinks: Array<{ src: string; dest: string }> = [];

	ensureDir(path: string): void {
		this.ensuredDirs.push(path);
	}

	ensureSymlink(src: string, dest: string): void {
		this.createdSymlinks.push({ src, dest });
	}

	removeDir(path: string): void {
		this.removedDirs.push(path);
	}

	writeFile(filePath: string, content: string): void {
		this.writtenFiles.set(filePath, content);
	}

	resolve(...paths: string[]): string {
		return paths.join("/");
	}
}

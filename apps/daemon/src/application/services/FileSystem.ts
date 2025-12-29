export interface FileSystem {
	ensureDir(path: string): void;
	ensureSymlink(src: string, dest: string): void;
	removeDir(path: string): void;
	writeFile(filePath: string, content: string): void;
	resolve(...paths: string[]): string;
}

import type { Result } from "neverthrow";

export interface FileSystem {
	ensureDir(path: string): void;
	removeDir(path: string): void;
	writeFile(filePath: string, content: string): void;
	resolve(...paths: string[]): string;
	glob(path: string, pattern: string): string[];
	exists(path: string): Result<boolean, Error>;
}

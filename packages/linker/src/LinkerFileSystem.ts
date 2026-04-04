import type { Result } from "neverthrow";

/**
 * File system operations required by the Linker.
 * Implementations handle actual symlink creation and removal on the platform.
 */
export interface LinkerFileSystem {
	ensureSymlink(src: string, dest: string): Promise<Result<void, Error>>;
	removeDir(path: string): void;
	resolve(...paths: string[]): string;
	exists(path: string): Result<boolean, Error>;
}

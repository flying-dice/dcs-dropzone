import { ensureSymlinkSync, lstatSync, type PathLike, type SymlinkType } from "fs-extra";

export class _EnsureSymlink {
	execute(src: string, dest: string): void {
		const type = this.getSymlinkType(src);

		ensureSymlinkSync(src, dest, type);
	}

	private getSymlinkType(pathlike: PathLike): SymlinkType {
		const srcStat = lstatSync(pathlike);

		const isDir = srcStat.isDirectory();

		return process.platform === "win32" && isDir ? "junction" : isDir ? "dir" : "file";
	}
}

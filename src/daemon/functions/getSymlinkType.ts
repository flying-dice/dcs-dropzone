import { lstatSync, type PathLike, type SymlinkType } from "fs-extra";

export function getSymlinkType(pathlike: PathLike): SymlinkType {
	const srcStat = lstatSync(pathlike);

	const isDir = srcStat.isDirectory();

	return process.platform === "win32" && isDir ? "junction" : isDir ? "dir" : "file";
}

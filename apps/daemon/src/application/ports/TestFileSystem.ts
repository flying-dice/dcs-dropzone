import { mock } from "bun:test";
import type { FileSystem } from "./FileSystem.ts";

export class TestFileSystem implements FileSystem {
	ensureDir = mock<FileSystem["ensureDir"]>();
	ensureSymlink = mock<FileSystem["ensureSymlink"]>();
	removeDir = mock<FileSystem["removeDir"]>();
	writeFile = mock<FileSystem["writeFile"]>();
	resolve = mock<FileSystem["resolve"]>();
}

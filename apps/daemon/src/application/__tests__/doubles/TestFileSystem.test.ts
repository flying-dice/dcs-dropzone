import { describe, expect, it } from "bun:test";
import { TestFileSystem } from "./TestFileSystem.ts";

describe("TestFileSystem", () => {
	describe("ensureDir", () => {
		it("tracks ensured directories", () => {
			const fs = new TestFileSystem();
			fs.ensureDir("/path/to/dir");
			fs.ensureDir("/another/path");

			expect(fs.ensuredDirs).toHaveLength(2);
			expect(fs.ensuredDirs[0]).toBe("/path/to/dir");
			expect(fs.ensuredDirs[1]).toBe("/another/path");
		});

		it("allows duplicate directory ensures", () => {
			const fs = new TestFileSystem();
			fs.ensureDir("/same/path");
			fs.ensureDir("/same/path");

			expect(fs.ensuredDirs).toHaveLength(2);
		});
	});

	describe("writeFile", () => {
		it("tracks written files in a map", () => {
			const fs = new TestFileSystem();
			fs.writeFile("/file1.txt", "content1");
			fs.writeFile("/file2.txt", "content2");

			expect(fs.writtenFiles.size).toBe(2);
			expect(fs.writtenFiles.get("/file1.txt")).toBe("content1");
			expect(fs.writtenFiles.get("/file2.txt")).toBe("content2");
		});

		it("overwrites file content when writing to same path", () => {
			const fs = new TestFileSystem();
			fs.writeFile("/file.txt", "original");
			fs.writeFile("/file.txt", "updated");

			expect(fs.writtenFiles.size).toBe(1);
			expect(fs.writtenFiles.get("/file.txt")).toBe("updated");
		});
	});

	describe("removeDir", () => {
		it("tracks removed directories", () => {
			const fs = new TestFileSystem();
			fs.removeDir("/path/to/remove");
			fs.removeDir("/another/removal");

			expect(fs.removedDirs).toHaveLength(2);
			expect(fs.removedDirs[0]).toBe("/path/to/remove");
			expect(fs.removedDirs[1]).toBe("/another/removal");
		});
	});

	describe("ensureSymlink", () => {
		it("tracks created symlinks with source and destination", () => {
			const fs = new TestFileSystem();
			fs.ensureSymlink("/src/path", "/dest/path");
			fs.ensureSymlink("/another/src", "/another/dest");

			expect(fs.createdSymlinks).toHaveLength(2);
			expect(fs.createdSymlinks[0]).toEqual({ src: "/src/path", dest: "/dest/path" });
			expect(fs.createdSymlinks[1]).toEqual({ src: "/another/src", dest: "/another/dest" });
		});
	});

	describe("resolve", () => {
		it("joins paths with forward slashes", () => {
			const fs = new TestFileSystem();
			const result = fs.resolve("a", "b", "c");
			expect(result).toBe("a/b/c");
		});

		it("handles single path", () => {
			const fs = new TestFileSystem();
			const result = fs.resolve("single");
			expect(result).toBe("single");
		});

		it("handles empty path array", () => {
			const fs = new TestFileSystem();
			const result = fs.resolve();
			expect(result).toBe("");
		});
	});
});

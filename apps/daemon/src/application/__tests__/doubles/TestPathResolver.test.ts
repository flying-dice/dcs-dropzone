import { describe, expect, it } from "bun:test";
import { SymbolicLinkDestRoot } from "webapp";
import { TestFileSystem } from "./TestFileSystem.ts";
import { TestPathResolver } from "./TestPathResolver.ts";

describe("TestPathResolver", () => {
	it("extends PathResolver class", () => {
		const fileSystem = new TestFileSystem();
		const resolver = new TestPathResolver("/mods", "/install", "/working", fileSystem);
		expect(resolver).toBeDefined();
		expect(typeof resolver.resolveReleasePath).toBe("function");
		expect(typeof resolver.resolveSymbolicLinkPath).toBe("function");
	});

	describe("constructor", () => {
		it("accepts custom paths", () => {
			const fileSystem = new TestFileSystem();
			const resolver = new TestPathResolver("/custom/mods", "/custom/install", "/custom/working", fileSystem);
			expect(resolver).toBeDefined();
		});

		it("uses provided paths for resolution", () => {
			const fileSystem = new TestFileSystem();
			const resolver = new TestPathResolver("/mods", "/install", "/working", fileSystem);

			const releasePath = resolver.resolveReleasePath("release-1");
			expect(releasePath).toBe("/mods/release-1");
		});
	});

	describe("resolveReleasePath", () => {
		it("resolves release paths correctly", () => {
			const fileSystem = new TestFileSystem();
			const resolver = new TestPathResolver("/mods", "/install", "/working", fileSystem);

			const path = resolver.resolveReleasePath("release-123");
			expect(path).toBe("/mods/release-123");
		});

		it("resolves release paths with subdirectories", () => {
			const fileSystem = new TestFileSystem();
			const resolver = new TestPathResolver("/mods", "/install", "/working", fileSystem);

			const path = resolver.resolveReleasePath("release-123", "subdir/file.txt");
			expect(path).toBe("/mods/release-123/subdir/file.txt");
		});
	});

	describe("resolveSymbolicLinkPath", () => {
		it("resolves DCS_INSTALL_DIR paths", () => {
			const fileSystem = new TestFileSystem();
			const resolver = new TestPathResolver("/mods", "/install", "/working", fileSystem);

			const path = resolver.resolveSymbolicLinkPath(SymbolicLinkDestRoot.DCS_INSTALL_DIR);
			expect(path).toBe("/install");
		});

		it("resolves DCS_WORKING_DIR paths", () => {
			const fileSystem = new TestFileSystem();
			const resolver = new TestPathResolver("/mods", "/install", "/working", fileSystem);

			const path = resolver.resolveSymbolicLinkPath(SymbolicLinkDestRoot.DCS_WORKING_DIR);
			expect(path).toBe("/working");
		});

		it("resolves paths with subdirectories", () => {
			const fileSystem = new TestFileSystem();
			const resolver = new TestPathResolver("/mods", "/install", "/working", fileSystem);

			const path = resolver.resolveSymbolicLinkPath(SymbolicLinkDestRoot.DCS_WORKING_DIR, "Scripts/Hooks");
			expect(path).toBe("/working/Scripts/Hooks");
		});
	});
});

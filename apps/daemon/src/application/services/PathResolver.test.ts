import { describe, expect, it } from "bun:test";
import { SymbolicLinkDestRoot } from "webapp";
import type { FileSystem } from "./FileSystem.ts";
import { PathResolver } from "./PathResolver.ts";

describe("PathResolver", () => {
	const mockFileSystem: FileSystem = {
		resolve: (...paths: string[]) => paths.join("/"),
		writeFile: () => {},
		ensureDir: () => {},
		removeDir: () => {},
		ensureSymlink: () => {},
	};

	const deps = {
		dropzoneModsFolder: "/dropzone/mods",
		dcsInstallDir: "/dcs/install",
		dcsWorkingDir: "/dcs/working",
		fileSystem: mockFileSystem,
	};

	describe("resolveReleasePath", () => {
		it("resolves release path without additional path", () => {
			const resolver = new PathResolver(deps);
			const result = resolver.resolveReleasePath("release-123");
			expect(result).toBe("/dropzone/mods/release-123");
		});

		it("resolves release path with additional path", () => {
			const resolver = new PathResolver(deps);
			const result = resolver.resolveReleasePath("release-123", "assets/file.txt");
			expect(result).toBe("/dropzone/mods/release-123/assets/file.txt");
		});

		it("resolves release path with nested additional path", () => {
			const resolver = new PathResolver(deps);
			const result = resolver.resolveReleasePath("release-456", "deep/nested/path/file.lua");
			expect(result).toBe("/dropzone/mods/release-456/deep/nested/path/file.lua");
		});
	});

	describe("resolveSymbolicLinkPath", () => {
		it("resolves DCS_INSTALL_DIR root path without additional path", () => {
			const resolver = new PathResolver(deps);
			const result = resolver.resolveSymbolicLinkPath(SymbolicLinkDestRoot.DCS_INSTALL_DIR);
			expect(result).toBe("/dcs/install");
		});

		it("resolves DCS_INSTALL_DIR root path with additional path", () => {
			const resolver = new PathResolver(deps);
			const result = resolver.resolveSymbolicLinkPath(SymbolicLinkDestRoot.DCS_INSTALL_DIR, "Mods/aircraft");
			expect(result).toBe("/dcs/install/Mods/aircraft");
		});

		it("resolves DCS_WORKING_DIR root path without additional path", () => {
			const resolver = new PathResolver(deps);
			const result = resolver.resolveSymbolicLinkPath(SymbolicLinkDestRoot.DCS_WORKING_DIR);
			expect(result).toBe("/dcs/working");
		});

		it("resolves DCS_WORKING_DIR root path with additional path", () => {
			const resolver = new PathResolver(deps);
			const result = resolver.resolveSymbolicLinkPath(SymbolicLinkDestRoot.DCS_WORKING_DIR, "Scripts/file.lua");
			expect(result).toBe("/dcs/working/Scripts/file.lua");
		});

		it("resolves nested path with DCS_WORKING_DIR", () => {
			const resolver = new PathResolver(deps);
			const result = resolver.resolveSymbolicLinkPath(SymbolicLinkDestRoot.DCS_WORKING_DIR, "Scripts/Hooks/custom.lua");
			expect(result).toBe("/dcs/working/Scripts/Hooks/custom.lua");
		});
	});
});

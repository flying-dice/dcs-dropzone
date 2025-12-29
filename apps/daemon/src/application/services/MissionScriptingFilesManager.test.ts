import { describe, expect, it } from "bun:test";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import type { ReleaseRepository } from "../repository/ReleaseRepository.ts";
import type { FileSystem } from "./FileSystem.ts";
import { MissionScriptingFilesManager } from "./MissionScriptingFilesManager.ts";
import type { PathResolver } from "./PathResolver.ts";

describe("MissionScriptingFilesManager", () => {
	it("rebuilds mission scripting files with before and after sanitize scripts", () => {
		const writtenFiles: Record<string, string> = {};

		const mockFileSystem: FileSystem = {
			resolve: (...paths: string[]) => paths.join("/"),
			readFile: () => "",
			writeFile: (path: string, content: string) => {
				writtenFiles[path] = content;
			},
			ensureDir: () => {},
			removeDir: () => {},
			ensureSymlink: () => {},
			exists: () => false,
			readdir: () => [],
			stat: () => ({ isDirectory: () => false, isFile: () => false } as any),
		};

		const mockReleaseRepository: ReleaseRepository = {
			getMissionScriptsByRunOn: (runOn: MissionScriptRunOn) => {
				if (runOn === MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE) {
					return [
						{
							modName: "mod1",
							modVersion: "1.0.0",
							path: "scripts/before.lua",
							pathRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
						},
					];
				}
				if (runOn === MissionScriptRunOn.MISSION_START_AFTER_SANITIZE) {
					return [
						{
							modName: "mod2",
							modVersion: "2.0.0",
							path: "scripts/after.lua",
							pathRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
						},
					];
				}
				return [];
			},
			saveRelease: () => {},
			deleteRelease: () => {},
			getAllReleases: () => [],
			getReleaseAssetsForRelease: () => [],
			getSymbolicLinksForRelease: () => [],
			setInstalledPathForSymbolicLink: () => {},
			getMissionScriptsForRelease: () => [],
		};

		const mockPathResolver: PathResolver = {
			resolveReleasePath: () => "/release/path",
			resolveSymbolicLinkPath: (root: SymbolicLinkDestRoot, path?: string) => {
				if (root === SymbolicLinkDestRoot.DCS_WORKING_DIR) {
					return path ? `/dcs/working/${path}` : "/dcs/working";
				}
				return path ? `/dcs/install/${path}` : "/dcs/install";
			},
		} as PathResolver;

		const manager = new MissionScriptingFilesManager({
			fileSystem: mockFileSystem,
			releaseRepository: mockReleaseRepository,
			pathResolver: mockPathResolver,
		});

		manager.rebuild();

		expect(Object.keys(writtenFiles).length).toBe(2);
		expect(writtenFiles["/dcs/working/Scripts/DropzoneMissionScriptsBeforeSanitize.lua"]).toBeDefined();
		expect(writtenFiles["/dcs/working/Scripts/DropzoneMissionScriptsAfterSanitize.lua"]).toBeDefined();
	});

	it("generates scripts with correct paths", () => {
		const writtenFiles: Record<string, string> = {};

		const mockFileSystem: FileSystem = {
			resolve: (...paths: string[]) => paths.join("/"),
			readFile: () => "",
			writeFile: (path: string, content: string) => {
				writtenFiles[path] = content;
			},
			ensureDir: () => {},
			removeDir: () => {},
			ensureSymlink: () => {},
			exists: () => false,
			readdir: () => [],
			stat: () => ({ isDirectory: () => false, isFile: () => false } as any),
		};

		const mockReleaseRepository: ReleaseRepository = {
			getMissionScriptsByRunOn: (runOn: MissionScriptRunOn) => {
				if (runOn === MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE) {
					return [
						{
							modName: "test-mod",
							modVersion: "1.0.0",
							path: "init.lua",
							pathRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
						},
					];
				}
				return [];
			},
			saveRelease: () => {},
			deleteRelease: () => {},
			getAllReleases: () => [],
			getReleaseAssetsForRelease: () => [],
			getSymbolicLinksForRelease: () => [],
			setInstalledPathForSymbolicLink: () => {},
			getMissionScriptsForRelease: () => [],
		};

		const mockPathResolver: PathResolver = {
			resolveReleasePath: () => "/release/path",
			resolveSymbolicLinkPath: (root: SymbolicLinkDestRoot, path?: string) => {
				if (root === SymbolicLinkDestRoot.DCS_WORKING_DIR) {
					return path ? `/working/${path}` : "/working";
				}
				return "/install";
			},
		} as PathResolver;

		const manager = new MissionScriptingFilesManager({
			fileSystem: mockFileSystem,
			releaseRepository: mockReleaseRepository,
			pathResolver: mockPathResolver,
		});

		manager.rebuild();

		const beforeContent = writtenFiles["/working/Scripts/DropzoneMissionScriptsBeforeSanitize.lua"];
		expect(beforeContent).toContain("/working/init.lua");
		expect(beforeContent).toContain("test-mod-1.0.0");
	});

	it("handles empty scripts list", () => {
		const writtenFiles: Record<string, string> = {};

		const mockFileSystem: FileSystem = {
			resolve: (...paths: string[]) => paths.join("/"),
			readFile: () => "",
			writeFile: (path: string, content: string) => {
				writtenFiles[path] = content;
			},
			ensureDir: () => {},
			removeDir: () => {},
			ensureSymlink: () => {},
			exists: () => false,
			readdir: () => [],
			stat: () => ({ isDirectory: () => false, isFile: () => false } as any),
		};

		const mockReleaseRepository: ReleaseRepository = {
			getMissionScriptsByRunOn: () => [],
			saveRelease: () => {},
			deleteRelease: () => {},
			getAllReleases: () => [],
			getReleaseAssetsForRelease: () => [],
			getSymbolicLinksForRelease: () => [],
			setInstalledPathForSymbolicLink: () => {},
			getMissionScriptsForRelease: () => [],
		};

		const mockPathResolver: PathResolver = {
			resolveReleasePath: () => "/release/path",
			resolveSymbolicLinkPath: (root: SymbolicLinkDestRoot, path?: string) => {
				return path ? `/dcs/${path}` : "/dcs";
			},
		} as PathResolver;

		const manager = new MissionScriptingFilesManager({
			fileSystem: mockFileSystem,
			releaseRepository: mockReleaseRepository,
			pathResolver: mockPathResolver,
		});

		manager.rebuild();

		expect(Object.keys(writtenFiles).length).toBe(2);
		// Both files should still be written even if empty
		expect(writtenFiles["/dcs/Scripts/DropzoneMissionScriptsBeforeSanitize.lua"]).toBeDefined();
		expect(writtenFiles["/dcs/Scripts/DropzoneMissionScriptsAfterSanitize.lua"]).toBeDefined();
	});
});

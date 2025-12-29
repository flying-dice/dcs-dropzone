import { describe, expect, it } from "bun:test";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import { TestReleaseRepository } from "../repository/impl/TestReleaseRepository.ts";
import { TestFileSystem } from "./impl/TestFileSystem.ts";
import { BaseMissionScriptingFilesManager } from "./MissionScriptingFilesManager.ts";
import { BasePathResolver } from "./PathResolver.ts";

describe("MissionScriptingFilesManager", () => {
	it("rebuilds mission scripting files with before and after sanitize scripts", () => {
		const fileSystem = new TestFileSystem();
		const releaseRepository = new TestReleaseRepository();
		const pathResolver = new BasePathResolver({
			dropzoneModsFolder: "/dropzone/mods",
			dcsInstallDir: "/dcs/install",
			dcsWorkingDir: "/dcs/working",
			fileSystem,
		});

		// Setup test data
		releaseRepository.saveRelease({
			releaseId: "release-1",
			modId: "mod-1",
			modName: "mod1",
			version: "1.0.0",
			versionHash: "hash1",
			dependencies: [],
			assets: [],
			symbolicLinks: [],
			missionScripts: [
				{
					name: "Before Script",
					purpose: "Test",
					path: "scripts/before.lua",
					root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
					runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
				},
			],
		});

		releaseRepository.saveRelease({
			releaseId: "release-2",
			modId: "mod-2",
			modName: "mod2",
			version: "2.0.0",
			versionHash: "hash2",
			dependencies: [],
			assets: [],
			symbolicLinks: [],
			missionScripts: [
				{
					name: "After Script",
					purpose: "Test",
					path: "scripts/after.lua",
					root: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
					runOn: MissionScriptRunOn.MISSION_START_AFTER_SANITIZE,
				},
			],
		});

		const manager = new BaseMissionScriptingFilesManager({
			fileSystem,
			releaseRepository,
			pathResolver,
		});

		manager.rebuild();

		expect(fileSystem.writtenFiles.size).toBe(2);
		expect(fileSystem.writtenFiles.has("/dcs/working/Scripts/DropzoneMissionScriptsBeforeSanitize.lua")).toBe(true);
		expect(fileSystem.writtenFiles.has("/dcs/working/Scripts/DropzoneMissionScriptsAfterSanitize.lua")).toBe(true);
	});

	it("generates scripts with correct paths", () => {
		const fileSystem = new TestFileSystem();
		const releaseRepository = new TestReleaseRepository();
		const pathResolver = new BasePathResolver({
			dropzoneModsFolder: "/dropzone/mods",
			dcsInstallDir: "/working",
			dcsWorkingDir: "/working",
			fileSystem,
		});

		releaseRepository.saveRelease({
			releaseId: "release-1",
			modId: "mod-1",
			modName: "test-mod",
			version: "1.0.0",
			versionHash: "hash1",
			dependencies: [],
			assets: [],
			symbolicLinks: [],
			missionScripts: [
				{
					name: "Test Script",
					purpose: "Test",
					path: "init.lua",
					root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
					runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
				},
			],
		});

		const manager = new BaseMissionScriptingFilesManager({
			fileSystem,
			releaseRepository,
			pathResolver,
		});

		manager.rebuild();

		const beforeContent = fileSystem.writtenFiles.get("/working/Scripts/DropzoneMissionScriptsBeforeSanitize.lua");
		expect(beforeContent).toContain("/working/init.lua");
		expect(beforeContent).toContain("test-mod-1.0.0");
	});

	it("handles empty scripts list", () => {
		const fileSystem = new TestFileSystem();
		const releaseRepository = new TestReleaseRepository();
		const pathResolver = new BasePathResolver({
			dropzoneModsFolder: "/dropzone/mods",
			dcsInstallDir: "/dcs",
			dcsWorkingDir: "/dcs",
			fileSystem,
		});

		const manager = new BaseMissionScriptingFilesManager({
			fileSystem,
			releaseRepository,
			pathResolver,
		});

		manager.rebuild();

		expect(fileSystem.writtenFiles.size).toBe(2);
		// Both files should still be written even if empty
		expect(fileSystem.writtenFiles.has("/dcs/Scripts/DropzoneMissionScriptsBeforeSanitize.lua")).toBe(true);
		expect(fileSystem.writtenFiles.has("/dcs/Scripts/DropzoneMissionScriptsAfterSanitize.lua")).toBe(true);
	});
});

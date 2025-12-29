import { describe, expect, it } from "bun:test";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import type { ModAndReleaseData } from "../../schemas/ModAndReleaseData.ts";
import { TestReleaseRepository } from "./TestReleaseRepository.ts";

describe("TestReleaseRepository", () => {
	describe("saveRelease", () => {
		it("tracks saved releases", () => {
			const repo = new TestReleaseRepository();
			const release: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [],
				missionScripts: [],
			};

			repo.saveRelease(release);

			expect(repo.savedReleases).toHaveLength(1);
			expect(repo.savedReleases[0]?.releaseId).toBe("release-1");
		});

		it("stores release data for later retrieval", () => {
			const repo = new TestReleaseRepository();
			const release: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: ["dep-1"],
				assets: [],
				symbolicLinks: [],
				missionScripts: [],
			};

			repo.saveRelease(release);
			const releases = repo.getAllReleases();

			expect(releases).toHaveLength(1);
			expect(releases[0]?.releaseId).toBe("release-1");
			expect(releases[0]?.dependencies).toContain("dep-1");
		});

		it("stores assets from release data", () => {
			const repo = new TestReleaseRepository();
			const release: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [
					{
						name: "Asset 1",
						urls: ["http://example.com/file1.zip"],
						isArchive: true,
					},
				],
				symbolicLinks: [],
				missionScripts: [],
			};

			repo.saveRelease(release);
			const assets = repo.getReleaseAssetsForRelease("release-1");

			expect(assets).toHaveLength(1);
			expect(assets[0]?.name).toBe("Asset 1");
			expect(assets[0]?.isArchive).toBe(true);
		});

		it("stores symbolic links from release data", () => {
			const repo = new TestReleaseRepository();
			const release: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [
					{
						name: "Link 1",
						src: "src/path",
						dest: "dest/path",
						destRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
					},
				],
				missionScripts: [],
			};

			repo.saveRelease(release);
			const links = repo.getSymbolicLinksForRelease("release-1");

			expect(links).toHaveLength(1);
			expect(links[0]?.name).toBe("Link 1");
			expect(links[0]?.installedPath).toBeNull();
		});

		it("stores mission scripts from release data", () => {
			const repo = new TestReleaseRepository();
			const release: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [],
				missionScripts: [
					{
						name: "Script 1",
						purpose: "Test script",
						path: "script.lua",
						root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
						runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
					},
				],
			};

			repo.saveRelease(release);
			const scripts = repo.getMissionScriptsForRelease("release-1");

			expect(scripts).toHaveLength(1);
			expect(scripts[0]?.name).toBe("Script 1");
			expect(scripts[0]?.runOn).toBe(MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE);
		});
	});

	describe("deleteRelease", () => {
		it("tracks deleted releases", () => {
			const repo = new TestReleaseRepository();
			repo.deleteRelease("release-1");
			repo.deleteRelease("release-2");

			expect(repo.deletedReleases).toHaveLength(2);
			expect(repo.deletedReleases).toContain("release-1");
			expect(repo.deletedReleases).toContain("release-2");
		});

		it("removes release from storage", () => {
			const repo = new TestReleaseRepository();
			const release: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [],
				missionScripts: [],
			};

			repo.saveRelease(release);
			expect(repo.getAllReleases()).toHaveLength(1);

			repo.deleteRelease("release-1");
			expect(repo.getAllReleases()).toHaveLength(0);
		});

		it("removes associated assets", () => {
			const repo = new TestReleaseRepository();
			const release: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [{ name: "Asset 1", urls: ["http://example.com/file.zip"], isArchive: false }],
				symbolicLinks: [],
				missionScripts: [],
			};

			repo.saveRelease(release);
			repo.deleteRelease("release-1");

			expect(repo.getReleaseAssetsForRelease("release-1")).toHaveLength(0);
		});
	});

	describe("getAllReleases", () => {
		it("returns empty array initially", () => {
			const repo = new TestReleaseRepository();
			expect(repo.getAllReleases()).toHaveLength(0);
		});

		it("returns all saved releases", () => {
			const repo = new TestReleaseRepository();
			const release1: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Mod 1",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [],
				missionScripts: [],
			};
			const release2: ModAndReleaseData = {
				releaseId: "release-2",
				modId: "mod-2",
				modName: "Mod 2",
				version: "2.0.0",
				versionHash: "hash2",
				dependencies: [],
				assets: [],
				symbolicLinks: [],
				missionScripts: [],
			};

			repo.saveRelease(release1);
			repo.saveRelease(release2);

			const releases = repo.getAllReleases();
			expect(releases).toHaveLength(2);
		});
	});

	describe("getReleaseAssetsForRelease", () => {
		it("returns empty array for non-existent release", () => {
			const repo = new TestReleaseRepository();
			expect(repo.getReleaseAssetsForRelease("non-existent")).toHaveLength(0);
		});

		it("returns assets for specific release", () => {
			const repo = new TestReleaseRepository();
			const release: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [
					{ name: "Asset 1", urls: ["http://example.com/file1.zip"], isArchive: true },
					{ name: "Asset 2", urls: ["http://example.com/file2.zip"], isArchive: false },
				],
				symbolicLinks: [],
				missionScripts: [],
			};

			repo.saveRelease(release);
			const assets = repo.getReleaseAssetsForRelease("release-1");

			expect(assets).toHaveLength(2);
			expect(assets[0]?.name).toBe("Asset 1");
			expect(assets[1]?.name).toBe("Asset 2");
		});
	});

	describe("getSymbolicLinksForRelease", () => {
		it("returns empty array for non-existent release", () => {
			const repo = new TestReleaseRepository();
			expect(repo.getSymbolicLinksForRelease("non-existent")).toHaveLength(0);
		});

		it("returns symbolic links for specific release", () => {
			const repo = new TestReleaseRepository();
			const release: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [
					{
						name: "Link 1",
						src: "src1",
						dest: "dest1",
						destRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
					},
				],
				missionScripts: [],
			};

			repo.saveRelease(release);
			const links = repo.getSymbolicLinksForRelease("release-1");

			expect(links).toHaveLength(1);
			expect(links[0]?.src).toBe("src1");
		});
	});

	describe("setInstalledPathForSymbolicLink", () => {
		it("tracks installed paths", () => {
			const repo = new TestReleaseRepository();
			repo.setInstalledPathForSymbolicLink("link-1", "/installed/path");

			expect(repo.symbolicLinkPaths.get("link-1")).toBe("/installed/path");
		});

		it("updates installed path for symbolic link", () => {
			const repo = new TestReleaseRepository();
			const release: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [
					{
						name: "Link 1",
						src: "src",
						dest: "dest",
						destRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
					},
				],
				missionScripts: [],
			};

			repo.saveRelease(release);
			const links = repo.getSymbolicLinksForRelease("release-1");
			const linkId = links[0]!.id;

			repo.setInstalledPathForSymbolicLink(linkId, "/installed");
			const updatedLinks = repo.getSymbolicLinksForRelease("release-1");

			expect(updatedLinks[0]?.installedPath).toBe("/installed");
		});
	});

	describe("getMissionScriptsForRelease", () => {
		it("returns empty array for non-existent release", () => {
			const repo = new TestReleaseRepository();
			expect(repo.getMissionScriptsForRelease("non-existent")).toHaveLength(0);
		});

		it("returns mission scripts for specific release", () => {
			const repo = new TestReleaseRepository();
			const release: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [],
				missionScripts: [
					{
						name: "Script 1",
						purpose: "Test",
						path: "script1.lua",
						root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
						runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
					},
				],
			};

			repo.saveRelease(release);
			const scripts = repo.getMissionScriptsForRelease("release-1");

			expect(scripts).toHaveLength(1);
			expect(scripts[0]?.path).toBe("script1.lua");
		});
	});

	describe("getMissionScriptsByRunOn", () => {
		it("returns empty array when no releases exist", () => {
			const repo = new TestReleaseRepository();
			const scripts = repo.getMissionScriptsByRunOn(MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE);
			expect(scripts).toHaveLength(0);
		});

		it("filters scripts by runOn value", () => {
			const repo = new TestReleaseRepository();
			const release: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [],
				missionScripts: [
					{
						name: "Before Script",
						purpose: "Test",
						path: "before.lua",
						root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
						runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
					},
					{
						name: "After Script",
						purpose: "Test",
						path: "after.lua",
						root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
						runOn: MissionScriptRunOn.MISSION_START_AFTER_SANITIZE,
					},
				],
			};

			repo.saveRelease(release);
			const beforeScripts = repo.getMissionScriptsByRunOn(MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE);
			const afterScripts = repo.getMissionScriptsByRunOn(MissionScriptRunOn.MISSION_START_AFTER_SANITIZE);

			expect(beforeScripts).toHaveLength(1);
			expect(beforeScripts[0]?.path).toBe("before.lua");
			expect(afterScripts).toHaveLength(1);
			expect(afterScripts[0]?.path).toBe("after.lua");
		});

		it("includes mod name and version in results", () => {
			const repo = new TestReleaseRepository();
			const release: ModAndReleaseData = {
				releaseId: "release-1",
				modId: "mod-1",
				modName: "Test Mod",
				version: "2.3.4",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [],
				missionScripts: [
					{
						name: "Script",
						purpose: "Test",
						path: "script.lua",
						root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
						runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
					},
				],
			};

			repo.saveRelease(release);
			const scripts = repo.getMissionScriptsByRunOn(MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE);

			expect(scripts[0]?.modName).toBe("Test Mod");
			expect(scripts[0]?.modVersion).toBe("2.3.4");
		});
	});
});

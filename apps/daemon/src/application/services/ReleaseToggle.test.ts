import { describe, expect, it } from "bun:test";
import { SymbolicLinkDestRoot } from "webapp";
import { DownloadJobStatus } from "../enums/DownloadJobStatus.ts";
import { ExtractJobStatus } from "../enums/ExtractJobStatus.ts";
import {
	TestDownloadQueue,
	TestExtractQueue,
	TestFileSystem,
	TestMissionScriptingFilesManager,
	TestPathResolver,
	TestReleaseRepository,
} from "../__tests__/doubles/index.ts";
import { ReleaseToggle } from "./ReleaseToggle.ts";

describe("ReleaseToggle", () => {
	describe("enable", () => {
		it("enables release by creating symlinks and rebuilding mission scripts", () => {
			const fileSystem = new TestFileSystem();
			const pathResolver = new TestPathResolver("/dropzone/mods", "/dcs/install", "/dcs/working", fileSystem);
			const releaseRepository = new TestReleaseRepository();
			const downloadQueue = new TestDownloadQueue();
			const extractQueue = new TestExtractQueue();
			const missionScriptingManager = new TestMissionScriptingFilesManager();

			// Setup test data
			releaseRepository.saveRelease({
				releaseId: "release-123",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [
					{
						name: "Link 1",
						src: "mod-folder",
						dest: "Mods/mod-folder",
						destRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
					},
				],
				missionScripts: [],
			});

			// Set jobs as completed
			downloadQueue.pushJob("release-123", "asset-1", "job-1", "http://example.com", "/dest");
			downloadQueue.setJobStatus("asset-1", "job-1", DownloadJobStatus.COMPLETED, 100);

			extractQueue.pushJob("release-123", "asset-1", "extract-1", "/archive", "/dest", ["job-1"]);
			extractQueue.setJobStatus("asset-1", "extract-1", ExtractJobStatus.COMPLETED, 100);

			const releaseToggle = new ReleaseToggle({
				fileSystem,
				pathResolver,
				releaseRepository,
				downloadQueue,
				extractQueue,
				missionScriptingFilesManager: missionScriptingManager as any,
			});

			releaseToggle.enable("release-123");

			expect(fileSystem.createdSymlinks.length).toBe(1);
			expect(fileSystem.createdSymlinks[0]?.src).toBe("/dropzone/mods/release-123/mod-folder");
			expect(fileSystem.createdSymlinks[0]?.dest).toBe("/dcs/install/Mods/mod-folder");
			expect(missionScriptingManager.rebuildCount).toBe(1);
		});

		it("throws error when download jobs are not completed", () => {
			const fileSystem = new TestFileSystem();
			const pathResolver = new TestPathResolver("/dropzone/mods", "/dcs/install", "/dcs/working", fileSystem);
			const releaseRepository = new TestReleaseRepository();
			const downloadQueue = new TestDownloadQueue();
			const extractQueue = new TestExtractQueue();
			const missionScriptingManager = new TestMissionScriptingFilesManager();

			// Set download job as in progress
			downloadQueue.pushJob("release-123", "asset-1", "job-1", "http://example.com", "/dest");
			downloadQueue.setJobStatus("asset-1", "job-1", DownloadJobStatus.IN_PROGRESS, 50);

			extractQueue.pushJob("release-123", "asset-1", "extract-1", "/archive", "/dest", ["job-1"]);
			extractQueue.setJobStatus("asset-1", "extract-1", ExtractJobStatus.COMPLETED, 100);

			const releaseToggle = new ReleaseToggle({
				fileSystem,
				pathResolver,
				releaseRepository,
				downloadQueue,
				extractQueue,
				missionScriptingFilesManager: missionScriptingManager as any,
			});

			expect(() => releaseToggle.enable("release-123")).toThrow(
				"Cannot enable release release-123 because not all download jobs are completed.",
			);
		});

		it("throws error when extract jobs are not completed", () => {
			const fileSystem = new TestFileSystem();
			const pathResolver = new TestPathResolver("/dropzone/mods", "/dcs/install", "/dcs/working", fileSystem);
			const releaseRepository = new TestReleaseRepository();
			const downloadQueue = new TestDownloadQueue();
			const extractQueue = new TestExtractQueue();
			const missionScriptingManager = new TestMissionScriptingFilesManager();

			downloadQueue.pushJob("release-123", "asset-1", "job-1", "http://example.com", "/dest");
			downloadQueue.setJobStatus("asset-1", "job-1", DownloadJobStatus.COMPLETED, 100);

			extractQueue.pushJob("release-123", "asset-1", "extract-1", "/archive", "/dest", ["job-1"]);
			extractQueue.setJobStatus("asset-1", "extract-1", ExtractJobStatus.PENDING, 0);

			const releaseToggle = new ReleaseToggle({
				fileSystem,
				pathResolver,
				releaseRepository,
				downloadQueue,
				extractQueue,
				missionScriptingFilesManager: missionScriptingManager as any,
			});

			expect(() => releaseToggle.enable("release-123")).toThrow(
				"Cannot enable release release-123 because not all extract jobs are completed.",
			);
		});

		it("calls onCreateSymlink callback when provided", () => {
			const fileSystem = new TestFileSystem();
			const pathResolver = new TestPathResolver("/dropzone/mods", "/dcs/install", "/dcs/working", fileSystem);
			const releaseRepository = new TestReleaseRepository();
			const downloadQueue = new TestDownloadQueue();
			const extractQueue = new TestExtractQueue();
			const missionScriptingManager = new TestMissionScriptingFilesManager();
			const symlinkCallbacks: Array<{ src: string; dest: string }> = [];

			releaseRepository.saveRelease({
				releaseId: "release-123",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [
					{
						name: "Link 1",
						src: "src-path",
						dest: "dest-path",
						destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
					},
				],
				missionScripts: [],
			});

			downloadQueue.pushJob("release-123", "asset-1", "job-1", "http://example.com", "/dest");
			downloadQueue.setJobStatus("asset-1", "job-1", DownloadJobStatus.COMPLETED, 100);

			extractQueue.pushJob("release-123", "asset-1", "extract-1", "/archive", "/dest", ["job-1"]);
			extractQueue.setJobStatus("asset-1", "extract-1", ExtractJobStatus.COMPLETED, 100);

			const releaseToggle = new ReleaseToggle({
				fileSystem,
				pathResolver,
				releaseRepository,
				downloadQueue,
				extractQueue,
				missionScriptingFilesManager: missionScriptingManager as any,
				onCreateSymlink: (src, dest) => {
					symlinkCallbacks.push({ src, dest });
				},
			});

			releaseToggle.enable("release-123");

			expect(symlinkCallbacks.length).toBe(1);
			expect(symlinkCallbacks[0]?.src).toBe("/dropzone/mods/release-123/src-path");
			expect(symlinkCallbacks[0]?.dest).toBe("/dcs/working/dest-path");
		});
	});

	describe("disable", () => {
		it("disables release by removing symlinks and rebuilding mission scripts", () => {
			const fileSystem = new TestFileSystem();
			const pathResolver = new TestPathResolver("/dropzone/mods", "/dcs/install", "/dcs/working", fileSystem);
			const releaseRepository = new TestReleaseRepository();
			const downloadQueue = new TestDownloadQueue();
			const extractQueue = new TestExtractQueue();
			const missionScriptingManager = new TestMissionScriptingFilesManager();

			releaseRepository.saveRelease({
				releaseId: "release-123",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [
					{
						name: "Link 1",
						src: "src-path",
						dest: "dest-path",
						destRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
					},
				],
				missionScripts: [],
			});

			// Set installed path manually
			const links = releaseRepository.getSymbolicLinksForRelease("release-123");
			releaseRepository.setInstalledPathForSymbolicLink(links[0]!.id, "/installed/path");

			downloadQueue.pushJob("release-123", "asset-1", "job-1", "http://example.com", "/dest");
			downloadQueue.setJobStatus("asset-1", "job-1", DownloadJobStatus.COMPLETED, 100);

			extractQueue.pushJob("release-123", "asset-1", "extract-1", "/archive", "/dest", ["job-1"]);
			extractQueue.setJobStatus("asset-1", "extract-1", ExtractJobStatus.COMPLETED, 100);

			const releaseToggle = new ReleaseToggle({
				fileSystem,
				pathResolver,
				releaseRepository,
				downloadQueue,
				extractQueue,
				missionScriptingFilesManager: missionScriptingManager as any,
			});

			releaseToggle.disable("release-123");

			expect(fileSystem.removedDirs.length).toBe(1);
			expect(fileSystem.removedDirs[0]).toBe("/installed/path");
			expect(missionScriptingManager.rebuildCount).toBe(1);
		});

		it("skips symlinks without installed paths", () => {
			const fileSystem = new TestFileSystem();
			const pathResolver = new TestPathResolver("/dropzone/mods", "/dcs/install", "/dcs/working", fileSystem);
			const releaseRepository = new TestReleaseRepository();
			const downloadQueue = new TestDownloadQueue();
			const extractQueue = new TestExtractQueue();
			const missionScriptingManager = new TestMissionScriptingFilesManager();

			releaseRepository.saveRelease({
				releaseId: "release-123",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [
					{
						name: "Link 1",
						src: "src-path",
						dest: "dest-path",
						destRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
					},
				],
				missionScripts: [],
			});

			downloadQueue.pushJob("release-123", "asset-1", "job-1", "http://example.com", "/dest");
			downloadQueue.setJobStatus("asset-1", "job-1", DownloadJobStatus.COMPLETED, 100);

			extractQueue.pushJob("release-123", "asset-1", "extract-1", "/archive", "/dest", ["job-1"]);
			extractQueue.setJobStatus("asset-1", "extract-1", ExtractJobStatus.COMPLETED, 100);

			const releaseToggle = new ReleaseToggle({
				fileSystem,
				pathResolver,
				releaseRepository,
				downloadQueue,
				extractQueue,
				missionScriptingFilesManager: missionScriptingManager as any,
			});

			releaseToggle.disable("release-123");

			expect(fileSystem.removedDirs.length).toBe(0);
		});

		it("handles errors when removing symlinks", () => {
			const fileSystem = new TestFileSystem();
			// Override removeDir to throw error
			fileSystem.removeDir = () => {
				throw new Error("Failed to remove");
			};

			const pathResolver = new TestPathResolver("/dropzone/mods", "/dcs/install", "/dcs/working", fileSystem);
			const releaseRepository = new TestReleaseRepository();
			const downloadQueue = new TestDownloadQueue();
			const extractQueue = new TestExtractQueue();
			const missionScriptingManager = new TestMissionScriptingFilesManager();

			releaseRepository.saveRelease({
				releaseId: "release-123",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash1",
				dependencies: [],
				assets: [],
				symbolicLinks: [
					{
						name: "Link 1",
						src: "src-path",
						dest: "dest-path",
						destRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
					},
				],
				missionScripts: [],
			});

			const links = releaseRepository.getSymbolicLinksForRelease("release-123");
			releaseRepository.setInstalledPathForSymbolicLink(links[0]!.id, "/installed/path");

			downloadQueue.pushJob("release-123", "asset-1", "job-1", "http://example.com", "/dest");
			downloadQueue.setJobStatus("asset-1", "job-1", DownloadJobStatus.COMPLETED, 100);

			extractQueue.pushJob("release-123", "asset-1", "extract-1", "/archive", "/dest", ["job-1"]);
			extractQueue.setJobStatus("asset-1", "extract-1", ExtractJobStatus.COMPLETED, 100);

			const releaseToggle = new ReleaseToggle({
				fileSystem,
				pathResolver,
				releaseRepository,
				downloadQueue,
				extractQueue,
				missionScriptingFilesManager: missionScriptingManager as any,
			});

			// Should not throw, just log the error
			expect(() => releaseToggle.disable("release-123")).not.toThrow();
		});
	});
});

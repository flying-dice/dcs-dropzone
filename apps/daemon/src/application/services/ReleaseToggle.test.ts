import { describe, expect, it } from "bun:test";
import { SymbolicLinkDestRoot } from "webapp";
import { DownloadJobStatus } from "../enums/DownloadJobStatus.ts";
import { ExtractJobStatus } from "../enums/ExtractJobStatus.ts";
import type { ReleaseRepository } from "../repository/ReleaseRepository.ts";
import type { DownloadQueue } from "./DownloadQueue.ts";
import type { ExtractQueue } from "./ExtractQueue.ts";
import type { FileSystem } from "./FileSystem.ts";
import type { MissionScriptingFilesManager } from "./MissionScriptingFilesManager.ts";
import type { PathResolver } from "./PathResolver.ts";
import { ReleaseToggle } from "./ReleaseToggle.ts";

describe("ReleaseToggle", () => {
	describe("enable", () => {
		it("enables release by creating symlinks and rebuilding mission scripts", () => {
			const createdSymlinks: Array<{ src: string; dest: string }> = [];
			const rebuiltCount = { value: 0 };

			const mockFileSystem: FileSystem = {
				ensureSymlink: (src: string, dest: string) => {
					createdSymlinks.push({ src, dest });
				},
				resolve: (...paths: string[]) => paths.join("/"),
				writeFile: () => {},
				ensureDir: () => {},
				removeDir: () => {},
			};

			const mockPathResolver = {
				resolveReleasePath: (releaseId: string, path?: string) => `/releases/${releaseId}/${path || ""}`,
				resolveSymbolicLinkPath: (root: SymbolicLinkDestRoot, path?: string) => `/dcs/${root}/${path || ""}`,
			} as unknown as PathResolver;

			const mockReleaseRepository: ReleaseRepository = {
				getSymbolicLinksForRelease: () => [
					{
						id: "link1",
						releaseId: "release-123",
						name: "Link 1",
						src: "mod-folder",
						dest: "Mods/mod-folder",
						destRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
						installedPath: null,
					},
				],
				setInstalledPathForSymbolicLink: () => {},
				saveRelease: () => {},
				deleteRelease: () => {},
				getAllReleases: () => [],
				getReleaseAssetsForRelease: () => [],
				getMissionScriptsForRelease: () => [],
				getMissionScriptsByRunOn: () => [],
			};

			const mockDownloadQueue: DownloadQueue = {
				getJobsForReleaseId: () => [{ status: DownloadJobStatus.COMPLETED }],
			} as any;

			const mockExtractQueue: ExtractQueue = {
				getJobsForReleaseId: () => [{ status: ExtractJobStatus.COMPLETED }],
			} as any;

			const mockMissionScriptingManager: MissionScriptingFilesManager = {
				rebuild: () => {
					rebuiltCount.value++;
				},
			} as any;

			const releaseToggle = new ReleaseToggle({
				fileSystem: mockFileSystem,
				pathResolver: mockPathResolver,
				releaseRepository: mockReleaseRepository,
				downloadQueue: mockDownloadQueue,
				extractQueue: mockExtractQueue,
				missionScriptingFilesManager: mockMissionScriptingManager,
			});

			releaseToggle.enable("release-123");

			expect(createdSymlinks.length).toBe(1);
			expect(createdSymlinks[0]?.src).toBe("/releases/release-123/mod-folder");
			expect(createdSymlinks[0]?.dest).toBe("/dcs/DCS_INSTALL_DIR/Mods/mod-folder");
			expect(rebuiltCount.value).toBe(1);
		});

		it("throws error when download jobs are not completed", () => {
			const mockDownloadQueue: DownloadQueue = {
				getJobsForReleaseId: () => [{ status: DownloadJobStatus.IN_PROGRESS }],
			} as any;

			const mockExtractQueue: ExtractQueue = {
				getJobsForReleaseId: () => [{ status: ExtractJobStatus.COMPLETED }],
			} as any;

			const releaseToggle = new ReleaseToggle({
				fileSystem: {} as FileSystem,
				pathResolver: {} as PathResolver,
				releaseRepository: {} as ReleaseRepository,
				downloadQueue: mockDownloadQueue,
				extractQueue: mockExtractQueue,
				missionScriptingFilesManager: {} as MissionScriptingFilesManager,
			});

			expect(() => releaseToggle.enable("release-123")).toThrow(
				"Cannot enable release release-123 because not all download jobs are completed.",
			);
		});

		it("throws error when extract jobs are not completed", () => {
			const mockDownloadQueue: DownloadQueue = {
				getJobsForReleaseId: () => [{ status: DownloadJobStatus.COMPLETED }],
			} as any;

			const mockExtractQueue: ExtractQueue = {
				getJobsForReleaseId: () => [{ status: ExtractJobStatus.PENDING }],
			} as any;

			const releaseToggle = new ReleaseToggle({
				fileSystem: {} as FileSystem,
				pathResolver: {} as PathResolver,
				releaseRepository: {} as ReleaseRepository,
				downloadQueue: mockDownloadQueue,
				extractQueue: mockExtractQueue,
				missionScriptingFilesManager: {} as MissionScriptingFilesManager,
			});

			expect(() => releaseToggle.enable("release-123")).toThrow(
				"Cannot enable release release-123 because not all extract jobs are completed.",
			);
		});

		it("calls onCreateSymlink callback when provided", () => {
			const symlinkCallbacks: Array<{ src: string; dest: string }> = [];

			const mockFileSystem: FileSystem = {
				ensureSymlink: () => {},
				resolve: (...paths: string[]) => paths.join("/"),
				writeFile: () => {},
				ensureDir: () => {},
				removeDir: () => {},
			};

			const mockPathResolver = {
				resolveReleasePath: (releaseId: string, path?: string) => `/releases/${releaseId}/${path || ""}`,
				resolveSymbolicLinkPath: (root: SymbolicLinkDestRoot, path?: string) => `/dcs/${root}/${path || ""}`,
			} as unknown as PathResolver;

			const mockReleaseRepository: ReleaseRepository = {
				getSymbolicLinksForRelease: () => [
					{
						id: "link1",
						releaseId: "release-123",
						name: "Link 1",
						src: "src-path",
						dest: "dest-path",
						destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
						installedPath: null,
					},
				],
				setInstalledPathForSymbolicLink: () => {},
				saveRelease: () => {},
				deleteRelease: () => {},
				getAllReleases: () => [],
				getReleaseAssetsForRelease: () => [],
				getMissionScriptsForRelease: () => [],
				getMissionScriptsByRunOn: () => [],
			};

			const mockDownloadQueue: DownloadQueue = {
				getJobsForReleaseId: () => [{ status: DownloadJobStatus.COMPLETED }],
			} as any;

			const mockExtractQueue: ExtractQueue = {
				getJobsForReleaseId: () => [{ status: ExtractJobStatus.COMPLETED }],
			} as any;

			const releaseToggle = new ReleaseToggle({
				fileSystem: mockFileSystem,
				pathResolver: mockPathResolver,
				releaseRepository: mockReleaseRepository,
				downloadQueue: mockDownloadQueue,
				extractQueue: mockExtractQueue,
				missionScriptingFilesManager: { rebuild: () => {} } as any,
				onCreateSymlink: (src, dest) => {
					symlinkCallbacks.push({ src, dest });
				},
			});

			releaseToggle.enable("release-123");

			expect(symlinkCallbacks.length).toBe(1);
			expect(symlinkCallbacks[0]?.src).toBe("/releases/release-123/src-path");
			expect(symlinkCallbacks[0]?.dest).toBe("/dcs/DCS_WORKING_DIR/dest-path");
		});
	});

	describe("disable", () => {
		it("disables release by removing symlinks and rebuilding mission scripts", () => {
			const removedPaths: string[] = [];
			const rebuiltCount = { value: 0 };

			const mockFileSystem: FileSystem = {
				removeDir: (path: string) => {
					removedPaths.push(path);
				},
				resolve: (...paths: string[]) => paths.join("/"),
				writeFile: () => {},
				ensureDir: () => {},
				ensureSymlink: () => {},
			};

			const mockReleaseRepository: ReleaseRepository = {
				getSymbolicLinksForRelease: () => [
					{
						id: "link1",
						releaseId: "release-123",
						name: "Link 1",
						src: "src-path",
						dest: "dest-path",
						destRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
						installedPath: "/installed/path",
					},
				],
				setInstalledPathForSymbolicLink: () => {},
				saveRelease: () => {},
				deleteRelease: () => {},
				getAllReleases: () => [],
				getReleaseAssetsForRelease: () => [],
				getMissionScriptsForRelease: () => [],
				getMissionScriptsByRunOn: () => [],
			};

			const mockDownloadQueue: DownloadQueue = {
				getJobsForReleaseId: () => [{ status: DownloadJobStatus.COMPLETED }],
			} as any;

			const mockExtractQueue: ExtractQueue = {
				getJobsForReleaseId: () => [{ status: ExtractJobStatus.COMPLETED }],
			} as any;

			const mockMissionScriptingManager: MissionScriptingFilesManager = {
				rebuild: () => {
					rebuiltCount.value++;
				},
			} as any;

			const releaseToggle = new ReleaseToggle({
				fileSystem: mockFileSystem,
				pathResolver: {} as PathResolver,
				releaseRepository: mockReleaseRepository,
				downloadQueue: mockDownloadQueue,
				extractQueue: mockExtractQueue,
				missionScriptingFilesManager: mockMissionScriptingManager,
			});

			releaseToggle.disable("release-123");

			expect(removedPaths.length).toBe(1);
			expect(removedPaths[0]).toBe("/installed/path");
			expect(rebuiltCount.value).toBe(1);
		});

		it("skips symlinks without installed paths", () => {
			const removedPaths: string[] = [];

			const mockFileSystem: FileSystem = {
				removeDir: (path: string) => {
					removedPaths.push(path);
				},
				resolve: (...paths: string[]) => paths.join("/"),
				writeFile: () => {},
				ensureDir: () => {},
				ensureSymlink: () => {},
			};

			const mockReleaseRepository: ReleaseRepository = {
				getSymbolicLinksForRelease: () => [
					{
						id: "link1",
						releaseId: "release-123",
						name: "Link 1",
						src: "src-path",
						dest: "dest-path",
						destRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
						installedPath: null,
					},
				],
				setInstalledPathForSymbolicLink: () => {},
				saveRelease: () => {},
				deleteRelease: () => {},
				getAllReleases: () => [],
				getReleaseAssetsForRelease: () => [],
				getMissionScriptsForRelease: () => [],
				getMissionScriptsByRunOn: () => [],
			};

			const mockDownloadQueue: DownloadQueue = {
				getJobsForReleaseId: () => [{ status: DownloadJobStatus.COMPLETED }],
			} as any;

			const mockExtractQueue: ExtractQueue = {
				getJobsForReleaseId: () => [{ status: ExtractJobStatus.COMPLETED }],
			} as any;

			const releaseToggle = new ReleaseToggle({
				fileSystem: mockFileSystem,
				pathResolver: {} as PathResolver,
				releaseRepository: mockReleaseRepository,
				downloadQueue: mockDownloadQueue,
				extractQueue: mockExtractQueue,
				missionScriptingFilesManager: { rebuild: () => {} } as any,
			});

			releaseToggle.disable("release-123");

			expect(removedPaths.length).toBe(0);
		});

		it("handles errors when removing symlinks", () => {
			const mockFileSystem: FileSystem = {
				removeDir: () => {
					throw new Error("Failed to remove");
				},
				resolve: (...paths: string[]) => paths.join("/"),
				writeFile: () => {},
				ensureDir: () => {},
				ensureSymlink: () => {},
			};

			const mockReleaseRepository: ReleaseRepository = {
				getSymbolicLinksForRelease: () => [
					{
						id: "link1",
						releaseId: "release-123",
						name: "Link 1",
						src: "src-path",
						dest: "dest-path",
						destRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
						installedPath: "/installed/path",
					},
				],
				setInstalledPathForSymbolicLink: () => {},
				saveRelease: () => {},
				deleteRelease: () => {},
				getAllReleases: () => [],
				getReleaseAssetsForRelease: () => [],
				getMissionScriptsForRelease: () => [],
				getMissionScriptsByRunOn: () => [],
			};

			const mockDownloadQueue: DownloadQueue = {
				getJobsForReleaseId: () => [{ status: DownloadJobStatus.COMPLETED }],
			} as any;

			const mockExtractQueue: ExtractQueue = {
				getJobsForReleaseId: () => [{ status: ExtractJobStatus.COMPLETED }],
			} as any;

			const releaseToggle = new ReleaseToggle({
				fileSystem: mockFileSystem,
				pathResolver: {} as PathResolver,
				releaseRepository: mockReleaseRepository,
				downloadQueue: mockDownloadQueue,
				extractQueue: mockExtractQueue,
				missionScriptingFilesManager: { rebuild: () => {} } as any,
			});

			// Should not throw, just log the error
			expect(() => releaseToggle.disable("release-123")).not.toThrow();
		});
	});
});

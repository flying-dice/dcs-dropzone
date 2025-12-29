import { describe, expect, it } from "bun:test";
import { SymbolicLinkDestRoot } from "webapp";
import { AssetStatus } from "../enums/AssetStatus.ts";
import { DownloadJobStatus } from "../enums/DownloadJobStatus.ts";
import { DownloadedReleaseStatus } from "../enums/DownloadedReleaseStatus.ts";
import { ExtractJobStatus } from "../enums/ExtractJobStatus.ts";
import type { ReleaseRepository } from "../repository/ReleaseRepository.ts";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import type { DownloadQueue } from "./DownloadQueue.ts";
import type { ExtractQueue } from "./ExtractQueue.ts";
import type { FileSystem } from "./FileSystem.ts";
import type { PathResolver } from "./PathResolver.ts";
import { ReleaseCatalog } from "./ReleaseCatalog.ts";
import type { ReleaseToggle } from "./ReleaseToggle.ts";

describe("ReleaseCatalog", () => {
	describe("add", () => {
		it("adds a release with assets and queues download jobs", () => {
			const pushedDownloadJobs: Array<{ releaseId: string; assetId: string; url: string }> = [];
			const ensuredDirs: string[] = [];

			const mockFileSystem: FileSystem = {
				ensureDir: (dir: string) => {
					ensuredDirs.push(dir);
				},
				resolve: (...paths: string[]) => paths.join("/"),
				readFile: () => "",
				writeFile: () => {},
				removeDir: () => {},
				ensureSymlink: () => {},
				exists: () => false,
				readdir: () => [],
				stat: () => ({ isDirectory: () => false, isFile: () => false } as any),
			};

			const mockPathResolver: PathResolver = {
				resolveReleasePath: (releaseId: string) => `/releases/${releaseId}`,
				resolveSymbolicLinkPath: () => "/dcs",
			} as PathResolver;

			const mockReleaseRepository: ReleaseRepository = {
				saveRelease: () => {},
				getReleaseAssetsForRelease: () => [
					{
						id: "asset1",
						releaseId: "release-123",
						name: "Asset 1",
						urls: ["https://example.com/file1.zip"],
						isArchive: false,
					},
				],
				deleteRelease: () => {},
				getAllReleases: () => [],
				getSymbolicLinksForRelease: () => [],
				setInstalledPathForSymbolicLink: () => {},
				getMissionScriptsForRelease: () => [],
				getMissionScriptsByRunOn: () => [],
			};

			const mockDownloadQueue: DownloadQueue = {
				pushJob: (releaseId: string, assetId: string, _jobId: string, url: string) => {
					pushedDownloadJobs.push({ releaseId, assetId, url });
				},
				getJobsForReleaseAssetId: () => [],
				getJobsForReleaseId: () => [],
				cancelJobsForRelease: () => {},
			} as any;

			const mockExtractQueue: ExtractQueue = {
				pushJob: () => {},
				getJobsForReleaseAssetId: () => [],
				getJobsForReleaseId: () => [],
				cancelJobsForRelease: () => {},
			} as any;

			const catalog = new ReleaseCatalog({
				releaseToggleService: {} as ReleaseToggle,
				pathResolver: mockPathResolver,
				downloadQueue: mockDownloadQueue,
				extractQueue: mockExtractQueue,
				releaseRepository: mockReleaseRepository,
				fileSystem: mockFileSystem,
			});

			const releaseData: ModAndReleaseData = {
				releaseId: "release-123",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash123",
				dependencies: [],
				assets: [],
				symbolicLinks: [],
				missionScripts: [],
			};

			catalog.add(releaseData);

			expect(ensuredDirs.length).toBe(1);
			expect(ensuredDirs[0]).toBe("/releases/release-123");
			expect(pushedDownloadJobs.length).toBe(1);
			expect(pushedDownloadJobs[0]?.url).toBe("https://example.com/file1.zip");
		});

		it("creates extract jobs for archive assets", () => {
			const pushedExtractJobs: Array<{ releaseId: string; assetId: string }> = [];

			const mockFileSystem: FileSystem = {
				ensureDir: () => {},
				resolve: (...paths: string[]) => paths.join("/"),
				readFile: () => "",
				writeFile: () => {},
				removeDir: () => {},
				ensureSymlink: () => {},
				exists: () => false,
				readdir: () => [],
				stat: () => ({ isDirectory: () => false, isFile: () => false } as any),
			};

			const mockPathResolver: PathResolver = {
				resolveReleasePath: (releaseId: string) => `/releases/${releaseId}`,
				resolveSymbolicLinkPath: () => "/dcs",
			} as PathResolver;

			const mockReleaseRepository: ReleaseRepository = {
				saveRelease: () => {},
				getReleaseAssetsForRelease: () => [
					{
						id: "asset1",
						releaseId: "release-123",
						name: "Archive Asset",
						urls: ["https://example.com/archive.zip"],
						isArchive: true,
					},
				],
				deleteRelease: () => {},
				getAllReleases: () => [],
				getSymbolicLinksForRelease: () => [],
				setInstalledPathForSymbolicLink: () => {},
				getMissionScriptsForRelease: () => [],
				getMissionScriptsByRunOn: () => [],
			};

			const mockDownloadQueue: DownloadQueue = {
				pushJob: () => {},
				getJobsForReleaseAssetId: () => [],
				getJobsForReleaseId: () => [],
				cancelJobsForRelease: () => {},
			} as any;

			const mockExtractQueue: ExtractQueue = {
				pushJob: (releaseId: string, assetId: string) => {
					pushedExtractJobs.push({ releaseId, assetId });
				},
				getJobsForReleaseAssetId: () => [],
				getJobsForReleaseId: () => [],
				cancelJobsForRelease: () => {},
			} as any;

			const catalog = new ReleaseCatalog({
				releaseToggleService: {} as ReleaseToggle,
				pathResolver: mockPathResolver,
				downloadQueue: mockDownloadQueue,
				extractQueue: mockExtractQueue,
				releaseRepository: mockReleaseRepository,
				fileSystem: mockFileSystem,
			});

			const releaseData: ModAndReleaseData = {
				releaseId: "release-123",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash123",
				dependencies: [],
				assets: [],
				symbolicLinks: [],
				missionScripts: [],
			};

			catalog.add(releaseData);

			expect(pushedExtractJobs.length).toBe(1);
			expect(pushedExtractJobs[0]?.assetId).toBe("asset1");
		});
	});

	describe("remove", () => {
		it("removes release by disabling, canceling jobs, and deleting files", () => {
			const disabledReleases: string[] = [];
			const canceledDownloads: string[] = [];
			const canceledExtracts: string[] = [];
			const removedDirs: string[] = [];
			const deletedReleases: string[] = [];

			const mockFileSystem: FileSystem = {
				removeDir: (dir: string) => {
					removedDirs.push(dir);
				},
				resolve: (...paths: string[]) => paths.join("/"),
				readFile: () => "",
				writeFile: () => {},
				ensureDir: () => {},
				ensureSymlink: () => {},
				exists: () => false,
				readdir: () => [],
				stat: () => ({ isDirectory: () => false, isFile: () => false } as any),
			};

			const mockPathResolver: PathResolver = {
				resolveReleasePath: (releaseId: string) => `/releases/${releaseId}`,
				resolveSymbolicLinkPath: () => "/dcs",
			} as PathResolver;

			const mockReleaseRepository: ReleaseRepository = {
				deleteRelease: (releaseId: string) => {
					deletedReleases.push(releaseId);
				},
				saveRelease: () => {},
				getAllReleases: () => [],
				getReleaseAssetsForRelease: () => [],
				getSymbolicLinksForRelease: () => [],
				setInstalledPathForSymbolicLink: () => {},
				getMissionScriptsForRelease: () => [],
				getMissionScriptsByRunOn: () => [],
			};

			const mockDownloadQueue: DownloadQueue = {
				cancelJobsForRelease: (releaseId: string) => {
					canceledDownloads.push(releaseId);
				},
				pushJob: () => {},
				getJobsForReleaseAssetId: () => [],
				getJobsForReleaseId: () => [],
			} as any;

			const mockExtractQueue: ExtractQueue = {
				cancelJobsForRelease: (releaseId: string) => {
					canceledExtracts.push(releaseId);
				},
				pushJob: () => {},
				getJobsForReleaseAssetId: () => [],
				getJobsForReleaseId: () => [],
			} as any;

			const mockReleaseToggle: ReleaseToggle = {
				disable: (releaseId: string) => {
					disabledReleases.push(releaseId);
				},
			} as any;

			const catalog = new ReleaseCatalog({
				releaseToggleService: mockReleaseToggle,
				pathResolver: mockPathResolver,
				downloadQueue: mockDownloadQueue,
				extractQueue: mockExtractQueue,
				releaseRepository: mockReleaseRepository,
				fileSystem: mockFileSystem,
			});

			catalog.remove("release-123");

			expect(disabledReleases.length).toBe(1);
			expect(disabledReleases[0]).toBe("release-123");
			expect(canceledDownloads.length).toBe(1);
			expect(canceledExtracts.length).toBe(1);
			expect(removedDirs.length).toBe(1);
			expect(removedDirs[0]).toBe("/releases/release-123");
			expect(deletedReleases.length).toBe(1);
		});
	});

	describe("getAllReleasesWithStatus", () => {
		it("returns releases with computed status", () => {
			const mockFileSystem: FileSystem = {
				resolve: (...paths: string[]) => paths.join("/"),
				readFile: () => "",
				writeFile: () => {},
				ensureDir: () => {},
				removeDir: () => {},
				ensureSymlink: () => {},
				exists: () => false,
				readdir: () => [],
				stat: () => ({ isDirectory: () => false, isFile: () => false } as any),
			};

			const mockReleaseRepository: ReleaseRepository = {
				getAllReleases: () => [
					{
						releaseId: "release-123",
						modId: "mod-1",
						modName: "Test Mod",
						version: "1.0.0",
						versionHash: "hash123",
						dependencies: [],
					},
				],
				getReleaseAssetsForRelease: () => [
					{
						id: "asset1",
						releaseId: "release-123",
						name: "Asset 1",
						urls: ["https://example.com/file.zip"],
						isArchive: false,
					},
				],
				getSymbolicLinksForRelease: () => [],
				getMissionScriptsForRelease: () => [],
				saveRelease: () => {},
				deleteRelease: () => {},
				setInstalledPathForSymbolicLink: () => {},
				getMissionScriptsByRunOn: () => [],
			};

			const mockDownloadQueue: DownloadQueue = {
				getJobsForReleaseAssetId: () => [
					{
						status: DownloadJobStatus.COMPLETED,
						progressPercent: 100,
					},
				],
				pushJob: () => {},
				getJobsForReleaseId: () => [],
				cancelJobsForRelease: () => {},
			} as any;

			const mockExtractQueue: ExtractQueue = {
				getJobsForReleaseAssetId: () => [
					{
						status: ExtractJobStatus.COMPLETED,
						progressPercent: 100,
					},
				],
				pushJob: () => {},
				getJobsForReleaseId: () => [],
				cancelJobsForRelease: () => {},
			} as any;

			const catalog = new ReleaseCatalog({
				releaseToggleService: {} as ReleaseToggle,
				pathResolver: {} as PathResolver,
				downloadQueue: mockDownloadQueue,
				extractQueue: mockExtractQueue,
				releaseRepository: mockReleaseRepository,
				fileSystem: mockFileSystem,
			});

			const releases = catalog.getAllReleasesWithStatus();

			expect(releases.length).toBe(1);
			expect(releases[0]?.releaseId).toBe("release-123");
			// When symbolicLinks is empty, the .every() returns true (vacuously true), so status is ENABLED
			expect(releases[0]?.status).toBe(DownloadedReleaseStatus.ENABLED);
			expect(releases[0]?.assets[0]?.statusData?.status).toBe(AssetStatus.COMPLETED);
		});

		it("computes IN_PROGRESS status correctly", () => {
			const mockReleaseRepository: ReleaseRepository = {
				getAllReleases: () => [
					{
						releaseId: "release-456",
						modId: "mod-2",
						modName: "Test Mod 2",
						version: "2.0.0",
						versionHash: "hash456",
						dependencies: [],
					},
				],
				getReleaseAssetsForRelease: () => [
					{
						id: "asset2",
						releaseId: "release-456",
						name: "Asset 2",
						urls: ["https://example.com/file2.zip"],
						isArchive: false,
					},
				],
				getSymbolicLinksForRelease: () => [],
				getMissionScriptsForRelease: () => [],
				saveRelease: () => {},
				deleteRelease: () => {},
				setInstalledPathForSymbolicLink: () => {},
				getMissionScriptsByRunOn: () => [],
			};

			const mockDownloadQueue: DownloadQueue = {
				getJobsForReleaseAssetId: () => [
					{
						status: DownloadJobStatus.IN_PROGRESS,
						progressPercent: 50,
					},
				],
				pushJob: () => {},
				getJobsForReleaseId: () => [],
				cancelJobsForRelease: () => {},
			} as any;

			const mockExtractQueue: ExtractQueue = {
				getJobsForReleaseAssetId: () => [
					{
						status: ExtractJobStatus.PENDING,
						progressPercent: 0,
					},
				],
				pushJob: () => {},
				getJobsForReleaseId: () => [],
				cancelJobsForRelease: () => {},
			} as any;

			const catalog = new ReleaseCatalog({
				releaseToggleService: {} as ReleaseToggle,
				pathResolver: {} as PathResolver,
				downloadQueue: mockDownloadQueue,
				extractQueue: mockExtractQueue,
				releaseRepository: mockReleaseRepository,
				fileSystem: {} as FileSystem,
			});

			const releases = catalog.getAllReleasesWithStatus();

			expect(releases[0]?.status).toBe(DownloadedReleaseStatus.IN_PROGRESS);
			expect(releases[0]?.assets[0]?.statusData?.status).toBe(AssetStatus.IN_PROGRESS);
		});
	});
});

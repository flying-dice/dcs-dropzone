import { describe, expect, it } from "bun:test";
import { AssetStatus } from "../enums/AssetStatus.ts";
import { DownloadJobStatus } from "../enums/DownloadJobStatus.ts";
import { DownloadedReleaseStatus } from "../enums/DownloadedReleaseStatus.ts";
import { ExtractJobStatus } from "../enums/ExtractJobStatus.ts";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import {
	TestDownloadQueue,
	TestExtractQueue,
	TestFileSystem,
	TestMissionScriptingFilesManager,
	TestPathResolver,
	TestReleaseRepository,
} from "../__tests__/doubles/index.ts";
import { ReleaseCatalog } from "./ReleaseCatalog.ts";
import { ReleaseToggle } from "./ReleaseToggle.ts";

describe("ReleaseCatalog", () => {
	describe("add", () => {
		it("adds a release with assets and queues download jobs", () => {
			const fileSystem = new TestFileSystem();
			const pathResolver = new TestPathResolver("/dropzone/mods", "/dcs/install", "/dcs/working", fileSystem);
			const releaseRepository = new TestReleaseRepository();
			const downloadQueue = new TestDownloadQueue();
			const extractQueue = new TestExtractQueue();
			const missionScriptingManager = new TestMissionScriptingFilesManager();

			const releaseToggleService = new ReleaseToggle({
				fileSystem,
				pathResolver,
				releaseRepository,
				downloadQueue,
				extractQueue,
				missionScriptingFilesManager: missionScriptingManager as any,
			});

			const catalog = new ReleaseCatalog({
				releaseToggleService,
				pathResolver,
				downloadQueue,
				extractQueue,
				releaseRepository,
				fileSystem,
			});

			const releaseData: ModAndReleaseData = {
				releaseId: "release-123",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash123",
				dependencies: [],
				assets: [
					{
						name: "Asset 1",
						urls: ["https://example.com/file1.zip"],
						isArchive: false,
					},
				],
				symbolicLinks: [],
				missionScripts: [],
			};

			catalog.add(releaseData);

			expect(fileSystem.ensuredDirs.length).toBe(1);
			expect(fileSystem.ensuredDirs[0]).toBe("/dropzone/mods/release-123");
			expect(downloadQueue.pushedJobs.length).toBe(1);
			expect(downloadQueue.pushedJobs[0]?.url).toBe("https://example.com/file1.zip");
		});

		it("creates extract jobs for archive assets", () => {
			const fileSystem = new TestFileSystem();
			const pathResolver = new TestPathResolver("/dropzone/mods", "/dcs/install", "/dcs/working", fileSystem);
			const releaseRepository = new TestReleaseRepository();
			const downloadQueue = new TestDownloadQueue();
			const extractQueue = new TestExtractQueue();
			const missionScriptingManager = new TestMissionScriptingFilesManager();

			const releaseToggleService = new ReleaseToggle({
				fileSystem,
				pathResolver,
				releaseRepository,
				downloadQueue,
				extractQueue,
				missionScriptingFilesManager: missionScriptingManager as any,
			});

			const catalog = new ReleaseCatalog({
				releaseToggleService,
				pathResolver,
				downloadQueue,
				extractQueue,
				releaseRepository,
				fileSystem,
			});

			const releaseData: ModAndReleaseData = {
				releaseId: "release-123",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash123",
				dependencies: [],
				assets: [
					{
						name: "Archive Asset",
						urls: ["https://example.com/archive.zip"],
						isArchive: true,
					},
				],
				symbolicLinks: [],
				missionScripts: [],
			};

			catalog.add(releaseData);

			expect(extractQueue.pushedJobs.length).toBe(1);
			expect(extractQueue.pushedJobs[0]?.assetId).toContain("Archive Asset");
		});
	});

	describe("remove", () => {
		it("removes release by disabling, canceling jobs, and deleting files", () => {
			const fileSystem = new TestFileSystem();
			const pathResolver = new TestPathResolver("/dropzone/mods", "/dcs/install", "/dcs/working", fileSystem);
			const releaseRepository = new TestReleaseRepository();
			const downloadQueue = new TestDownloadQueue();
			const extractQueue = new TestExtractQueue();
			const missionScriptingManager = new TestMissionScriptingFilesManager();

			const releaseToggleService = new ReleaseToggle({
				fileSystem,
				pathResolver,
				releaseRepository,
				downloadQueue,
				extractQueue,
				missionScriptingFilesManager: missionScriptingManager as any,
			});

			const catalog = new ReleaseCatalog({
				releaseToggleService,
				pathResolver,
				downloadQueue,
				extractQueue,
				releaseRepository,
				fileSystem,
			});

			// Add a release first
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

			// Mark all jobs as completed so we can disable
			for (const job of downloadQueue.pushedJobs) {
				downloadQueue.setJobStatus(job.assetId, job.jobId, DownloadJobStatus.COMPLETED, 100);
			}
			for (const job of extractQueue.pushedJobs) {
				extractQueue.setJobStatus(job.assetId, job.jobId, ExtractJobStatus.COMPLETED, 100);
			}

			catalog.remove("release-123");

			expect(downloadQueue.canceledReleases).toContain("release-123");
			expect(extractQueue.canceledReleases).toContain("release-123");
			expect(fileSystem.removedDirs).toContain("/dropzone/mods/release-123");
			expect(releaseRepository.deletedReleases).toContain("release-123");
		});
	});

	describe("getAllReleasesWithStatus", () => {
		it("returns releases with computed status", () => {
			const fileSystem = new TestFileSystem();
			const pathResolver = new TestPathResolver("/dropzone/mods", "/dcs/install", "/dcs/working", fileSystem);
			const releaseRepository = new TestReleaseRepository();
			const downloadQueue = new TestDownloadQueue();
			const extractQueue = new TestExtractQueue();
			const missionScriptingManager = new TestMissionScriptingFilesManager();

			const releaseToggleService = new ReleaseToggle({
				fileSystem,
				pathResolver,
				releaseRepository,
				downloadQueue,
				extractQueue,
				missionScriptingFilesManager: missionScriptingManager as any,
			});

			const catalog = new ReleaseCatalog({
				releaseToggleService,
				pathResolver,
				downloadQueue,
				extractQueue,
				releaseRepository,
				fileSystem,
			});

			const releaseData: ModAndReleaseData = {
				releaseId: "release-123",
				modId: "mod-1",
				modName: "Test Mod",
				version: "1.0.0",
				versionHash: "hash123",
				dependencies: [],
				assets: [
					{
						name: "Asset 1",
						urls: ["https://example.com/file.zip"],
						isArchive: false,
					},
				],
				symbolicLinks: [],
				missionScripts: [],
			};

			catalog.add(releaseData);

			// Set all jobs to completed
			for (const job of downloadQueue.pushedJobs) {
				downloadQueue.setJobStatus(job.assetId, job.jobId, DownloadJobStatus.COMPLETED, 100);
			}
			for (const job of extractQueue.pushedJobs) {
				extractQueue.setJobStatus(job.assetId, job.jobId, ExtractJobStatus.COMPLETED, 100);
			}

			const releases = catalog.getAllReleasesWithStatus();

			expect(releases.length).toBe(1);
			expect(releases[0]?.releaseId).toBe("release-123");
			// When symbolicLinks is empty, the .every() returns true (vacuously true), so status is ENABLED
			expect(releases[0]?.status).toBe(DownloadedReleaseStatus.ENABLED);
			expect(releases[0]?.assets[0]?.statusData?.status).toBe(AssetStatus.COMPLETED);
		});

		it("computes IN_PROGRESS status correctly", () => {
			const fileSystem = new TestFileSystem();
			const pathResolver = new TestPathResolver("/dropzone/mods", "/dcs/install", "/dcs/working", fileSystem);
			const releaseRepository = new TestReleaseRepository();
			const downloadQueue = new TestDownloadQueue();
			const extractQueue = new TestExtractQueue();
			const missionScriptingManager = new TestMissionScriptingFilesManager();

			const releaseToggleService = new ReleaseToggle({
				fileSystem,
				pathResolver,
				releaseRepository,
				downloadQueue,
				extractQueue,
				missionScriptingFilesManager: missionScriptingManager as any,
			});

			const catalog = new ReleaseCatalog({
				releaseToggleService,
				pathResolver,
				downloadQueue,
				extractQueue,
				releaseRepository,
				fileSystem,
			});

			const releaseData: ModAndReleaseData = {
				releaseId: "release-456",
				modId: "mod-2",
				modName: "Test Mod 2",
				version: "2.0.0",
				versionHash: "hash456",
				dependencies: [],
				assets: [
					{
						name: "Asset 2",
						urls: ["https://example.com/file2.zip"],
						isArchive: false,
					},
				],
				symbolicLinks: [],
				missionScripts: [],
			};

			catalog.add(releaseData);

			// Set download to in progress
			for (const job of downloadQueue.pushedJobs) {
				downloadQueue.setJobStatus(job.assetId, job.jobId, DownloadJobStatus.IN_PROGRESS, 50);
			}

			const releases = catalog.getAllReleasesWithStatus();

			expect(releases[0]?.status).toBe(DownloadedReleaseStatus.IN_PROGRESS);
			expect(releases[0]?.assets[0]?.statusData?.status).toBe(AssetStatus.IN_PROGRESS);
		});
	});
});

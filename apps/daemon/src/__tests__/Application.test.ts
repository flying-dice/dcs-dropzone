import "./log4js.ts";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { ok } from "node:assert";
import { dirname, join } from "node:path";
import { InMemoryJobRecordRepository, JobState } from "@packages/queue";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import { Application } from "../application/Application.ts";
import { DownloadedReleaseStatus } from "../application/enums/DownloadedReleaseStatus.ts";
import type { DownloadJobData, DownloadJobResult } from "../application/ports/DownloadProcessor.ts";
import type { ExtractJobData, ExtractJobResult } from "../application/ports/ExtractProcessor.ts";
import type { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";
import { DropzoneModsDirNotConfigured } from "../application/services/PathResolver.ts";
import { ReleaseNotFound, ReleaseNotReady, SymlinkCreationFailed } from "../application/services/ReleaseToggle.ts";
import { MISSION_START_AFTER_SANITIZE, MISSION_START_BEFORE_SANITIZE } from "../constants.ts";
import { TestApplication } from "./TestApplication.ts";
import { TestCases } from "./TestCases.ts";
import { TestDelayProcessor } from "./TestDelayProcessor.ts";
import { TestFileSystem } from "./TestFileSystem.ts";
import { TestKeyValueRepository } from "./TestKeyValueRepository.ts";
import { TestReleaseRepository } from "./TestReleaseRepository.ts";
import type { TestTempDir } from "./TestTempDir.ts";
import { TestUUIDGenerator } from "./TestUUIDGenerator.ts";
import { waitForJobsForRelease } from "./utils.ts";

/**
 * Creates real source files on disk that the Linker expects to exist.
 * In test mode, the download/extract processors are stubs that don't create real files,
 * but the concrete Linker needs real source files to create symlinks.
 */
function createSourceFilesOnDisk(app: Application, releaseData: ModAndReleaseData) {
	const modsDir = app.settings.getDropzoneModsDir();
	if (!modsDir) return;
	for (const link of releaseData.symbolicLinks) {
		const srcPath = join(modsDir, releaseData.releaseId, link.src);
		mkdirSync(dirname(srcPath), { recursive: true });
		writeFileSync(srcPath, "test content");
	}
}

describe.each(TestCases)("$label", ({ build }) => {
	let modAndReleaseData: ModAndReleaseData;
	let app: Application;
	let tempDir: TestTempDir;

	beforeEach(() => {
		const c = build();
		app = c.app;
		tempDir = c.tempDir;
		modAndReleaseData = {
			releaseId: "test-release-id",
			modId: "test-mod-id",
			modName: "Test Mod",
			dependencies: [],
			version: "1.0.0",
			versionHash: Date.now().toString(),
			assets: [
				{
					id: "test-release-id__asset-1",
					name: "Test Asset",
					urls: [
						{
							id: "test-release-id__asset-1__url-1",
							url: "https://github.com/flying-dice/hello-world-mod/raw/refs/heads/main/sample-1.zip",
						},
					],
					isArchive: true,
				},
			],
			symbolicLinks: [
				{
					id: "symbolic-link-1",
					name: "Test Script",
					src: "sample-1/sample-1.webp",
					dest: "Scripts/test.lua",
					destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				},
			],
			missionScripts: [
				{
					id: "mission-script-1",
					name: "Test Mission Script",
					purpose: "Testing mission script",
					path: "Scripts/test.lua",
					root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
					runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
				},
			],
		};
	});

	afterEach(() => {
		tempDir.cleanup();
	});

	describe("addRelease", () => {
		it("should add the release, assets, symlinks, mission scripts to the repository and create jobs", () => {
			app.addRelease(modAndReleaseData)._unsafeUnwrap();

			const allReleases = app.deps.releaseRepository.getAllReleases();
			const assetsForRelease = app.deps.releaseRepository.getReleaseAssetsForRelease(modAndReleaseData.releaseId);
			const symbolicLinksForRelease = app.deps.releaseRepository.getSymbolicLinksForRelease(
				modAndReleaseData.releaseId,
			);
			const missionScriptsForRelease = app.deps.releaseRepository.getMissionScriptsForRelease(
				modAndReleaseData.releaseId,
			);
			const downloadJobs = app.deps.jobRecordRepository.findAllForProcessor("download");
			const extractJobs = app.deps.jobRecordRepository.findAllForProcessor("extract");

			expect(allReleases.length).toEqual(1);
			expect(allReleases[0]).toEqual({
				modId: "test-mod-id",
				modName: "Test Mod",
				releaseId: "test-release-id",
				version: "1.0.0",
				versionHash: modAndReleaseData.versionHash,
				dependencies: [],
				enabled: false,
			});

			expect(assetsForRelease.length).toEqual(modAndReleaseData.assets.length);
			expect(assetsForRelease[0]).toEqual({
				id: "test-release-id__asset-1",
				releaseId: "test-release-id",
				name: "Test Asset",
				isArchive: true,
				urls: [
					{
						id: "test-release-id__asset-1__url-1",
						url: "https://github.com/flying-dice/hello-world-mod/raw/refs/heads/main/sample-1.zip",
					},
				],
			});

			expect(symbolicLinksForRelease.length).toEqual(modAndReleaseData.symbolicLinks.length);
			expect(symbolicLinksForRelease[0]).toEqual({
				id: "symbolic-link-1",
				releaseId: "test-release-id",
				name: "Test Script",
				src: "sample-1/sample-1.webp",
				dest: "Scripts/test.lua",
				destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				installedPath: null,
			});

			expect(missionScriptsForRelease.length).toEqual(modAndReleaseData.missionScripts.length);
			expect(missionScriptsForRelease[0]).toEqual({
				id: "mission-script-1",
				releaseId: "test-release-id",
				name: "Test Mission Script",
				purpose: "Testing mission script",
				root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
				installedPath: null,
				path: "Scripts/test.lua",
			});

			expect(downloadJobs.length).toEqual(1);
			const dropzoneModsDir = app.settings.getDropzoneModsDir();
			ok(dropzoneModsDir);

			expect(downloadJobs[0]).toMatchObject({
				jobData: {
					url: "https://github.com/flying-dice/hello-world-mod/raw/refs/heads/main/sample-1.zip",
					destinationFolder: join(dropzoneModsDir, "test-release-id"),
					releaseId: "test-release-id",
					assetId: "test-release-id__asset-1",
					urlId: "test-release-id__asset-1__url-1",
				},
			});

			expect(extractJobs.length).toEqual(1);
			expect(extractJobs[0]).toMatchObject({
				jobData: {
					archivePath: join(dropzoneModsDir, "test-release-id", "sample-1.zip"),
					destinationFolder: join(dropzoneModsDir, "test-release-id"),
					releaseId: "test-release-id",
					assetId: "test-release-id__asset-1",
				},
			});
		});
	});

	describe("RemoveRelease", () => {
		it("should remove the release and all associated data from the repository", () => {
			app.addRelease(modAndReleaseData)._unsafeUnwrap();
			app.removeRelease(modAndReleaseData.releaseId);

			const allReleases = app.deps.releaseRepository.getAllReleases();
			const assetsForRelease = app.deps.releaseRepository.getReleaseAssetsForRelease(modAndReleaseData.releaseId);
			const symbolicLinksForRelease = app.deps.releaseRepository.getSymbolicLinksForRelease(
				modAndReleaseData.releaseId,
			);
			const missionScriptsForRelease = app.deps.releaseRepository.getMissionScriptsForRelease(
				modAndReleaseData.releaseId,
			);
			const downloadJobs = app.deps.jobRecordRepository.findAllForProcessor("download");
			const extractJobs = app.deps.jobRecordRepository.findAllForProcessor("extract");

			expect(allReleases.length).toEqual(0);
			expect(assetsForRelease.length).toEqual(0);
			expect(symbolicLinksForRelease.length).toEqual(0);
			expect(missionScriptsForRelease.length).toEqual(0);
			expect(downloadJobs.length).toEqual(1);
			expect(downloadJobs[0]?.state).toEqual(JobState.Cancelled);
			expect(extractJobs.length).toEqual(1);
			expect(extractJobs[0]?.state).toEqual(JobState.Cancelled);
		});
	});

	describe("EnableRelease", () => {
		it("should enable the release successfully when all jobs are completed", async () => {
			app.addRelease(modAndReleaseData)._unsafeUnwrap();

			await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 5);
			createSourceFilesOnDisk(app, modAndReleaseData);

			const downloadJobs = app.deps.jobRecordRepository.findAllForProcessor("download");
			const extractJobs = app.deps.jobRecordRepository.findAllForProcessor("extract");

			expect(downloadJobs.length).toEqual(1);
			expect(extractJobs.length).toEqual(1);

			expect(downloadJobs[0]?.state).toEqual(JobState.Success);
			expect(extractJobs[0]?.state).toEqual(JobState.Success);

			const resolvedLinks = (await app.enableRelease(modAndReleaseData.releaseId))._unsafeUnwrap();

			const symbolicLinks = app.deps.releaseRepository.getSymbolicLinksForRelease(modAndReleaseData.releaseId);
			const symlinkInstalledPath = symbolicLinks[0]?.installedPath;
			ok(symlinkInstalledPath);
			expect(symlinkInstalledPath).toEndWith("test.lua");

			expect(resolvedLinks.length).toEqual(symbolicLinks.length);
			for (const resolved of resolvedLinks) {
				expect(resolved.id).toBeDefined();
				expect(resolved.src).toBeDefined();
				expect(resolved.dest).toEndWith("test.lua");
			}
		});

		it("should write Mission Scripting Files", async () => {
			app.addRelease(modAndReleaseData)._unsafeUnwrap();
			await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 5);
			createSourceFilesOnDisk(app, modAndReleaseData);

			(await app.enableRelease(modAndReleaseData.releaseId))._unsafeUnwrap();

			const dcsWorkingDir = app.settings.getDcsWorkingDir();
			ok(dcsWorkingDir);
			const dcsWorkingDirFiles = app.deps.fileSystem.glob(dcsWorkingDir, "**/*");

			const missionStartAfterSanitizeFile = dcsWorkingDirFiles.find((f) => f.endsWith(MISSION_START_AFTER_SANITIZE));

			const missionStartBeforeSanitizeFile = dcsWorkingDirFiles.find((f) => f.endsWith(MISSION_START_BEFORE_SANITIZE));

			expect(missionStartBeforeSanitizeFile).toBeDefined();
			expect(missionStartAfterSanitizeFile).toBeDefined();
		});

		it("should reflect ENABLED status in getAllReleasesWithStatus after enabling", async () => {
			app.addRelease(modAndReleaseData)._unsafeUnwrap();
			await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 5);
			createSourceFilesOnDisk(app, modAndReleaseData);

			(await app.enableRelease(modAndReleaseData.releaseId))._unsafeUnwrap();

			const releases = app.getAllReleasesWithStatus();
			expect(releases.length).toEqual(1);
			expect(releases[0]?.status).toBe(DownloadedReleaseStatus.ENABLED);
		});

		it("should reflect DISABLED status in getAllReleasesWithStatus after disabling", async () => {
			app.addRelease(modAndReleaseData)._unsafeUnwrap();
			await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 5);
			createSourceFilesOnDisk(app, modAndReleaseData);

			(await app.enableRelease(modAndReleaseData.releaseId))._unsafeUnwrap();
			app.disableRelease(modAndReleaseData.releaseId)._unsafeUnwrap();

			const releases = app.getAllReleasesWithStatus();
			expect(releases.length).toEqual(1);
			expect(releases[0]?.status).toBe(DownloadedReleaseStatus.DISABLED);
		});

		it("should generate removeSymlinks.bat after enabling a release", async () => {
			app.addRelease(modAndReleaseData)._unsafeUnwrap();
			await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 5);
			createSourceFilesOnDisk(app, modAndReleaseData);

			(await app.enableRelease(modAndReleaseData.releaseId))._unsafeUnwrap();

			const dropzoneModsDir = app.settings.getDropzoneModsDir();
			ok(dropzoneModsDir);
			const removeSymlinksBatFiles = app.deps.fileSystem.glob(join(dropzoneModsDir, ".."), "**/removeSymlinks.bat");

			expect(removeSymlinksBatFiles.length).toBeGreaterThanOrEqual(1);
		});

		it("should regenerate removeSymlinks.bat after disabling a release", async () => {
			app.addRelease(modAndReleaseData)._unsafeUnwrap();
			await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 5);
			createSourceFilesOnDisk(app, modAndReleaseData);

			(await app.enableRelease(modAndReleaseData.releaseId))._unsafeUnwrap();
			app.disableRelease(modAndReleaseData.releaseId)._unsafeUnwrap();

			const dropzoneModsDir = app.settings.getDropzoneModsDir();
			ok(dropzoneModsDir);
			const removeSymlinksBatFiles = app.deps.fileSystem.glob(join(dropzoneModsDir, ".."), "**/removeSymlinks.bat");

			expect(removeSymlinksBatFiles.length).toBeGreaterThanOrEqual(1);
		});
	});
});

class UnconfiguredTestApplication extends Application {
	constructor() {
		super({
			jobRecordRepository: new InMemoryJobRecordRepository(),
			downloadProcessor: new TestDelayProcessor<"download", DownloadJobData, DownloadJobResult>("download"),
			extractProcessor: new TestDelayProcessor<"extract", ExtractJobData, ExtractJobResult>("extract"),
			keyValueRepository: new TestKeyValueRepository(),
			releaseRepository: new TestReleaseRepository(),
			fileSystem: new TestFileSystem(),
			generateUuid: TestUUIDGenerator(),
		});
	}
}

describe("Unconfigured paths", () => {
	let app: UnconfiguredTestApplication;
	let modAndReleaseData: ModAndReleaseData;

	beforeEach(() => {
		app = new UnconfiguredTestApplication();
		modAndReleaseData = {
			releaseId: "test-release-id",
			modId: "test-mod-id",
			modName: "Test Mod",
			dependencies: [],
			version: "1.0.0",
			versionHash: Date.now().toString(),
			assets: [
				{
					id: "test-release-id__asset-1",
					name: "Test Asset",
					urls: [
						{
							id: "test-release-id__asset-1__url-1",
							url: "https://example.com/sample.zip",
						},
					],
					isArchive: true,
				},
			],
			symbolicLinks: [
				{
					id: "symbolic-link-1",
					name: "Test Script",
					src: "sample/test.lua",
					dest: "Scripts/test.lua",
					destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				},
			],
			missionScripts: [],
		};
	});

	describe("addRelease without dropzone mods dir configured", () => {
		it("should return a DropzoneModsDirNotConfigured error", () => {
			const result = app.addRelease(modAndReleaseData);

			expect(result.isErr()).toBe(true);
			expect(result._unsafeUnwrapErr()).toBeInstanceOf(DropzoneModsDirNotConfigured);
		});

		it("should not persist an orphaned release record", () => {
			app.addRelease(modAndReleaseData);

			const allReleases = app.deps.releaseRepository.getAllReleases();
			expect(allReleases.length).toEqual(0);
		});
	});

	describe("removeRelease without directories configured", () => {
		it("should succeed even when no directories are configured", () => {
			// Force a release into the repository to simulate an orphaned state
			app.deps.releaseRepository.saveRelease(modAndReleaseData);

			const allReleasesBefore = app.deps.releaseRepository.getAllReleases();
			expect(allReleasesBefore.length).toEqual(1);

			// removeRelease should not throw even though paths aren't configured
			expect(() => app.removeRelease(modAndReleaseData.releaseId)).not.toThrow();

			const allReleasesAfter = app.deps.releaseRepository.getAllReleases();
			expect(allReleasesAfter.length).toEqual(0);
		});
	});
});

describe("Symlink creation failure", () => {
	let app: TestApplication;
	let modAndReleaseData: ModAndReleaseData;

	beforeEach(() => {
		app = new TestApplication();
		modAndReleaseData = {
			releaseId: "test-release-id",
			modId: "test-mod-id",
			modName: "Test Mod",
			dependencies: [],
			version: "1.0.0",
			versionHash: Date.now().toString(),
			assets: [
				{
					id: "test-release-id__asset-1",
					name: "Test Asset",
					urls: [
						{
							id: "test-release-id__asset-1__url-1",
							url: "https://example.com/sample.zip",
						},
					],
					isArchive: true,
				},
			],
			symbolicLinks: [
				{
					id: "symbolic-link-1",
					name: "Test Script",
					src: "sample/test.lua",
					dest: "Scripts/test.lua",
					destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				},
			],
			missionScripts: [],
		};
	});

	it("should return SymlinkCreationFailed error when source files do not exist on disk", async () => {
		app.addRelease(modAndReleaseData)._unsafeUnwrap();
		await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 5);

		// The Linker will fail because the source files don't exist on disk
		// (TestApplication uses in-memory processors that don't create real files)
		const result = await app.enableRelease(modAndReleaseData.releaseId);

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBeInstanceOf(SymlinkCreationFailed);
		expect(result._unsafeUnwrapErr().type).toBe("SymlinkCreationFailed");
	});

	it("should not mark release as enabled when symlink creation fails", async () => {
		app.addRelease(modAndReleaseData)._unsafeUnwrap();
		await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 5);

		await app.enableRelease(modAndReleaseData.releaseId);

		const releases = app.getAllReleasesWithStatus();
		expect(releases.length).toEqual(1);
		expect(releases[0]?.status).not.toBe(DownloadedReleaseStatus.ENABLED);
	});

	it("should not store installed paths when symlink creation fails", async () => {
		app.addRelease(modAndReleaseData)._unsafeUnwrap();
		await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 5);

		await app.enableRelease(modAndReleaseData.releaseId);

		const symbolicLinks = app.deps.releaseRepository.getSymbolicLinksForRelease(modAndReleaseData.releaseId);
		for (const link of symbolicLinks) {
			expect(link.installedPath).toBeNull();
		}
	});
});

describe("ReleaseNotFound", () => {
	let app: TestApplication;

	beforeEach(() => {
		app = new TestApplication();
	});

	it("should return ReleaseNotFound when enabling a release that does not exist", async () => {
		const result = await app.enableRelease("non-existent-release-id");

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBeInstanceOf(ReleaseNotFound);
		expect(result._unsafeUnwrapErr().type).toBe("ReleaseNotFound");
	});

	it("should return ReleaseNotFound when disabling a release that does not exist", () => {
		const result = app.disableRelease("non-existent-release-id");

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBeInstanceOf(ReleaseNotFound);
		expect(result._unsafeUnwrapErr().type).toBe("ReleaseNotFound");
	});
});

describe("ReleaseNotReady", () => {
	let app: TestApplication;
	let modAndReleaseData: ModAndReleaseData;

	beforeEach(() => {
		app = new TestApplication();
		modAndReleaseData = {
			releaseId: "test-release-id",
			modId: "test-mod-id",
			modName: "Test Mod",
			dependencies: [],
			version: "1.0.0",
			versionHash: Date.now().toString(),
			assets: [
				{
					id: "test-release-id__asset-1",
					name: "Test Asset",
					urls: [{ id: "test-release-id__asset-1__url-1", url: "https://example.com/sample.zip" }],
					isArchive: true,
				},
			],
			symbolicLinks: [],
			missionScripts: [],
		};
	});

	it("should return ReleaseNotReady when enabling a release with incomplete jobs", async () => {
		app.addRelease(modAndReleaseData)._unsafeUnwrap();

		// Do not wait for jobs — attempt to enable immediately
		const result = await app.enableRelease(modAndReleaseData.releaseId);

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBeInstanceOf(ReleaseNotReady);
		expect(result._unsafeUnwrapErr().type).toBe("ReleaseNotReady");
	});
});

describe("toggleRelease", () => {
	let app: TestApplication;
	let modAndReleaseData: ModAndReleaseData;

	beforeEach(() => {
		app = new TestApplication();
		modAndReleaseData = {
			releaseId: "test-release-id",
			modId: "test-mod-id",
			modName: "Test Mod",
			dependencies: [],
			version: "1.0.0",
			versionHash: Date.now().toString(),
			assets: [],
			symbolicLinks: [],
			missionScripts: [],
		};
	});

	it("should return ReleaseNotFound when toggling a release that does not exist", async () => {
		const result = await app.toggleRelease("non-existent-release-id");

		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBeInstanceOf(ReleaseNotFound);
	});

	it("should enable a disabled release", async () => {
		app.addRelease(modAndReleaseData)._unsafeUnwrap();

		(await app.toggleRelease(modAndReleaseData.releaseId))._unsafeUnwrap();

		const release = app.deps.releaseRepository.getById(modAndReleaseData.releaseId);
		expect(release?.enabled).toBe(true);
	});

	it("should disable an enabled release", async () => {
		app.addRelease(modAndReleaseData)._unsafeUnwrap();
		(await app.enableRelease(modAndReleaseData.releaseId))._unsafeUnwrap();

		(await app.toggleRelease(modAndReleaseData.releaseId))._unsafeUnwrap();

		const release = app.deps.releaseRepository.getById(modAndReleaseData.releaseId);
		expect(release?.enabled).toBe(false);
	});
});

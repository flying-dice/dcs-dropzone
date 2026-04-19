import "./log4js.ts";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { ok } from "node:assert";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { RemovalFailed } from "@packages/linker";
import { JobState } from "@packages/queue";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import type { Application } from "../application/Application.ts";
import { DownloadedReleaseStatus } from "../application/enums/DownloadedReleaseStatus.ts";
import type { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";
import { MISSION_START_AFTER_SANITIZE, MISSION_START_BEFORE_SANITIZE } from "../constants.ts";
import { ProdApplication } from "../ProdApplication.ts";
import { TestCases } from "./TestCases.ts";
import { TestTempDir } from "./TestTempDir.ts";
import { SYSTEM_7ZIP_PATH, SYSTEM_WGET_PATH, waitForJobsForRelease } from "./utils.ts";

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
			const [, addErr] = app.addRelease(modAndReleaseData);
			expect(addErr).toBeNull();

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
				modsDir: expect.any(String),
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
			const [, addErr] = app.addRelease(modAndReleaseData);
			expect(addErr).toBeNull();
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
			const [, addErr] = app.addRelease(modAndReleaseData);
			expect(addErr).toBeNull();

			await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 15);
			createSourceFilesOnDisk(app, modAndReleaseData);

			const downloadJobs = app.deps.jobRecordRepository.findAllForProcessor("download");
			const extractJobs = app.deps.jobRecordRepository.findAllForProcessor("extract");

			expect(downloadJobs.length).toEqual(1);
			expect(extractJobs.length).toEqual(1);

			expect(downloadJobs[0]?.state).toEqual(JobState.Success);
			expect(extractJobs[0]?.state).toEqual(JobState.Success);

			const [, enableErr] = await app.enableRelease(modAndReleaseData.releaseId);
			expect(enableErr).toBeNull();

			const symbolicLinks = app.deps.releaseRepository.getSymbolicLinksForRelease(modAndReleaseData.releaseId);
			const symlinkInstalledPath = symbolicLinks[0]?.installedPath;
			ok(symlinkInstalledPath);
			expect(symlinkInstalledPath).toEndWith("test.lua");

			for (const link of symbolicLinks) {
				expect(link.installedPath).toBeDefined();
				expect(link.installedPath).toEndWith("test.lua");
			}
		});

		it("should write Mission Scripting Files", async () => {
			const [, addErr] = app.addRelease(modAndReleaseData);
			expect(addErr).toBeNull();
			await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 15);
			createSourceFilesOnDisk(app, modAndReleaseData);

			const [, enableErr] = await app.enableRelease(modAndReleaseData.releaseId);
			expect(enableErr).toBeNull();

			const dcsWorkingDir = app.settings.getDcsWorkingDir();
			ok(dcsWorkingDir);
			const dcsWorkingDirFiles = app.deps.fileSystem.glob(dcsWorkingDir, "**/*");

			const missionStartAfterSanitizeFile = dcsWorkingDirFiles.find((f) => f.endsWith(MISSION_START_AFTER_SANITIZE));

			const missionStartBeforeSanitizeFile = dcsWorkingDirFiles.find((f) => f.endsWith(MISSION_START_BEFORE_SANITIZE));

			expect(missionStartBeforeSanitizeFile).toBeDefined();
			expect(missionStartAfterSanitizeFile).toBeDefined();
		});

		it("should reflect ENABLED status in getAllReleasesWithStatus after enabling", async () => {
			const [, addErr] = app.addRelease(modAndReleaseData);
			expect(addErr).toBeNull();
			await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 15);
			createSourceFilesOnDisk(app, modAndReleaseData);

			const [, enableErr] = await app.enableRelease(modAndReleaseData.releaseId);
			expect(enableErr).toBeNull();

			const releases = app.getAllReleasesWithStatus();
			expect(releases.length).toEqual(1);
			expect(releases[0]?.status).toBe(DownloadedReleaseStatus.ENABLED);
		});

		it("should reflect DISABLED status in getAllReleasesWithStatus after disabling", async () => {
			const [, addErr] = app.addRelease(modAndReleaseData);
			expect(addErr).toBeNull();
			await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 15);
			createSourceFilesOnDisk(app, modAndReleaseData);

			const [, enableErr] = await app.enableRelease(modAndReleaseData.releaseId);
			expect(enableErr).toBeNull();
			const [, disableErr] = app.disableRelease(modAndReleaseData.releaseId);
			expect(disableErr).toBeNull();

			const releases = app.getAllReleasesWithStatus();
			expect(releases.length).toEqual(1);
			expect(releases[0]?.status).toBe(DownloadedReleaseStatus.DISABLED);
		});

		it("should generate removeSymlinks.bat after enabling a release", async () => {
			const [, addErr] = app.addRelease(modAndReleaseData);
			expect(addErr).toBeNull();
			await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 15);
			createSourceFilesOnDisk(app, modAndReleaseData);

			const [, enableErr] = await app.enableRelease(modAndReleaseData.releaseId);
			expect(enableErr).toBeNull();

			const dropzoneModsDir = app.settings.getDropzoneModsDir();
			ok(dropzoneModsDir);
			const removeSymlinksBatFiles = app.deps.fileSystem.glob(join(dropzoneModsDir, ".."), "**/removeSymlinks.bat");

			expect(removeSymlinksBatFiles.length).toBeGreaterThanOrEqual(1);
		});

		it("should regenerate removeSymlinks.bat after disabling a release", async () => {
			const [, addErr] = app.addRelease(modAndReleaseData);
			expect(addErr).toBeNull();
			await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 15);
			createSourceFilesOnDisk(app, modAndReleaseData);

			const [, enableErr] = await app.enableRelease(modAndReleaseData.releaseId);
			expect(enableErr).toBeNull();
			const [, disableErr] = app.disableRelease(modAndReleaseData.releaseId);
			expect(disableErr).toBeNull();

			const dropzoneModsDir = app.settings.getDropzoneModsDir();
			ok(dropzoneModsDir);
			const removeSymlinksBatFiles = app.deps.fileSystem.glob(join(dropzoneModsDir, ".."), "**/removeSymlinks.bat");

			expect(removeSymlinksBatFiles.length).toBeGreaterThanOrEqual(1);
		});
	});
});

function buildUnconfiguredApp() {
	return new ProdApplication({
		databaseUrl: ":memory:",
		wgetExecutablePath: SYSTEM_WGET_PATH,
		sevenZipExecutablePath: SYSTEM_7ZIP_PATH,
	});
}

function buildConfiguredApp() {
	const tempDir = new TestTempDir();
	const modsDir = tempDir.join("dcs-dropzone", "mods");
	const dcsWorkingDir = tempDir.join("dcs-dropzone", "dcs", "working");
	const dcsInstallDir = tempDir.join("dcs-dropzone", "dcs", "install");
	mkdirSync(modsDir, { recursive: true });
	mkdirSync(dcsWorkingDir, { recursive: true });
	mkdirSync(dcsInstallDir, { recursive: true });
	const app = new ProdApplication({
		databaseUrl: ":memory:",
		wgetExecutablePath: SYSTEM_WGET_PATH,
		sevenZipExecutablePath: SYSTEM_7ZIP_PATH,
	});
	app.settings.setAll({ dropzoneModsDir: modsDir, dcsWorkingDir, dcsInstallDir });
	return { app, tempDir };
}

describe("Unconfigured paths", () => {
	let app: Application;
	let modAndReleaseData: ModAndReleaseData;

	beforeEach(() => {
		app = buildUnconfiguredApp();
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
		beforeEach(() => {
			// Point to a path that is guaranteed not to exist so the test is
			// deterministic regardless of what the default resolves to on a
			// given machine (e.g. Jenkins may have created the default dir in
			// a prior build).
			app.settings.setAll({ dropzoneModsDir: "/this/path/does/not/exist/dropzone/mods" });
		});

		it("should return a DropzoneModsDirInvalid error when default path does not exist", () => {
			const [, err] = app.addRelease(modAndReleaseData);

			expect(err).toEqual(expect.objectContaining({ reason: "DropzoneModsDirInvalid", errorCode: "PATH_NOT_FOUND" }));
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
	let app: Application;
	let tempDir: TestTempDir;
	let modAndReleaseData: ModAndReleaseData;

	beforeEach(() => {
		const configured = buildConfiguredApp();
		app = configured.app;
		tempDir = configured.tempDir;
		modAndReleaseData = {
			releaseId: "test-release-id",
			modId: "test-mod-id",
			modName: "Test Mod",
			dependencies: [],
			version: "1.0.0",
			versionHash: Date.now().toString(),
			// No assets → release is immediately "ready" without waiting for downloads
			assets: [],
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

	afterEach(() => {
		tempDir.cleanup();
	});

	it("should return SymlinkCreationFailed error when source files do not exist on disk", async () => {
		const [, addErr] = app.addRelease(modAndReleaseData);
		expect(addErr).toBeNull();

		// No assets → immediately ready. The Linker fails because the source path does not exist on disk.
		const [, enableErr] = await app.enableRelease(modAndReleaseData.releaseId);

		expect(enableErr).toEqual(expect.objectContaining({ reason: "SymlinkCreationFailed" }));
		expect(enableErr!.reason).toBe("SymlinkCreationFailed");
		expect(enableErr!).toHaveProperty("errorCode");
		expect(enableErr!).toHaveProperty("systemError");
	});

	it("should not mark release as enabled when symlink creation fails", async () => {
		const [, addErr] = app.addRelease(modAndReleaseData);
		expect(addErr).toBeNull();

		await app.enableRelease(modAndReleaseData.releaseId);

		const releases = app.getAllReleasesWithStatus();
		expect(releases.length).toEqual(1);
		expect(releases[0]?.status).not.toBe(DownloadedReleaseStatus.ENABLED);
	});

	it("should not store installed paths when symlink creation fails", async () => {
		const [, addErr] = app.addRelease(modAndReleaseData);
		expect(addErr).toBeNull();

		await app.enableRelease(modAndReleaseData.releaseId);

		const symbolicLinks = app.deps.releaseRepository.getSymbolicLinksForRelease(modAndReleaseData.releaseId);
		for (const link of symbolicLinks) {
			expect(link.installedPath).toBeNull();
		}
	});
});

describe("ReleaseNotFound", () => {
	let app: Application;
	let tempDir: TestTempDir;

	beforeEach(() => {
		const configured = buildConfiguredApp();
		app = configured.app;
		tempDir = configured.tempDir;
	});

	afterEach(() => {
		tempDir.cleanup();
	});

	it("should return ReleaseNotFound when enabling a release that does not exist", async () => {
		const [, enableErr] = await app.enableRelease("non-existent-release-id");

		expect(enableErr).toEqual({ reason: "ReleaseNotFound" });
	});

	it("should return ReleaseNotFound when disabling a release that does not exist", () => {
		const [, disableErr] = app.disableRelease("non-existent-release-id");

		expect(disableErr).toEqual({ reason: "ReleaseNotFound" });
	});
});

describe("ReleaseNotReady", () => {
	let app: Application;
	let tempDir: TestTempDir;
	let modAndReleaseData: ModAndReleaseData;

	beforeEach(() => {
		const configured = buildConfiguredApp();
		app = configured.app;
		tempDir = configured.tempDir;
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

	afterEach(() => {
		tempDir.cleanup();
	});

	it("should return ReleaseNotReady when enabling a release with incomplete jobs", async () => {
		const [, addErr] = app.addRelease(modAndReleaseData);
		expect(addErr).toBeNull();

		// Do not wait for jobs — attempt to enable immediately
		const [, enableErr] = await app.enableRelease(modAndReleaseData.releaseId);

		expect(enableErr).toEqual(
			expect.objectContaining({
				reason: "ReleaseNotReady",
				pendingCount: expect.any(Number),
				failedCount: expect.any(Number),
			}),
		);
	});
});

describe("toggleRelease", () => {
	let app: Application;
	let tempDir: TestTempDir;
	let modAndReleaseData: ModAndReleaseData;

	beforeEach(() => {
		const configured = buildConfiguredApp();
		app = configured.app;
		tempDir = configured.tempDir;
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

	afterEach(() => {
		tempDir.cleanup();
	});

	it("should return ReleaseNotFound when toggling a release that does not exist", async () => {
		const [, toggleErr] = await app.toggleRelease("non-existent-release-id");

		expect(toggleErr).toEqual({ reason: "ReleaseNotFound" });
	});

	it("should enable a disabled release", async () => {
		const [, addErr] = app.addRelease(modAndReleaseData);
		expect(addErr).toBeNull();

		const [, toggleErr] = await app.toggleRelease(modAndReleaseData.releaseId);
		expect(toggleErr).toBeNull();

		const release = app.deps.releaseRepository.getById(modAndReleaseData.releaseId);
		expect(release?.enabled).toBe(true);
	});

	it("should disable an enabled release", async () => {
		const [, addErr] = app.addRelease(modAndReleaseData);
		expect(addErr).toBeNull();
		const [, enableErr] = await app.enableRelease(modAndReleaseData.releaseId);
		expect(enableErr).toBeNull();

		const [, toggleErr] = await app.toggleRelease(modAndReleaseData.releaseId);
		expect(toggleErr).toBeNull();

		const release = app.deps.releaseRepository.getById(modAndReleaseData.releaseId);
		expect(release?.enabled).toBe(false);
	});
});

describe("PartialDisableFailure", () => {
	let app: Application;
	let tempDir: TestTempDir;
	let modAndReleaseData: ModAndReleaseData;

	beforeEach(() => {
		const configured = buildConfiguredApp();
		app = configured.app;
		tempDir = configured.tempDir;
		modAndReleaseData = {
			releaseId: "test-release-id",
			modId: "test-mod-id",
			modName: "Test Mod",
			dependencies: [],
			version: "1.0.0",
			versionHash: Date.now().toString(),
			assets: [],
			symbolicLinks: [
				{
					id: "link-1",
					name: "Link A",
					src: "sample/a.lua",
					dest: "Scripts/a.lua",
					destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				},
				{
					id: "link-2",
					name: "Link B",
					src: "sample/b.lua",
					dest: "Scripts/b.lua",
					destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				},
			],
			missionScripts: [],
		};
	});

	afterEach(() => {
		tempDir.cleanup();
	});

	it("should keep release enabled and return failures when some symlinks cannot be removed", async () => {
		const [, addErr] = app.addRelease(modAndReleaseData);
		expect(addErr).toBeNull();

		// Create real source files so enable succeeds
		createSourceFilesOnDisk(app, modAndReleaseData);

		const [, enableErr] = await app.enableRelease(modAndReleaseData.releaseId);
		expect(enableErr).toBeNull();

		// Verify both links have installed paths
		const linksBefore = app.deps.releaseRepository.getSymbolicLinksForRelease(modAndReleaseData.releaseId);
		expect(linksBefore.filter((l) => l.installedPath !== null).length).toBe(2);

		// Monkey-patch the linker to simulate partial failure: link-1 removed, link-2 fails
		app.deps.linker.disable = () => [
			undefined,
			{
				removed: ["link-1"],
				failed: [new RemovalFailed("link-2", "Permission denied")],
			},
		];

		const [, disableErr] = app.disableRelease(modAndReleaseData.releaseId);

		// (1) Error is a PartialDisableFailure with structured details
		ok(disableErr);
		expect(disableErr.reason).toBe("PartialDisableFailure");
		if (disableErr.reason === "PartialDisableFailure") {
			expect(disableErr.removedCount).toBe(1);
			expect(disableErr.failedCount).toBe(1);
			expect(disableErr.failures).toEqual([{ linkId: "link-2", message: expect.any(String) }]);
		}

		// (2) Release stays enabled
		const release = app.deps.releaseRepository.getById(modAndReleaseData.releaseId);
		expect(release?.enabled).toBe(true);

		// (3) Only the successfully removed link has its installed path cleared
		const linksAfter = app.deps.releaseRepository.getSymbolicLinksForRelease(modAndReleaseData.releaseId);
		const link1 = linksAfter.find((l) => l.id === "link-1");
		const link2 = linksAfter.find((l) => l.id === "link-2");
		expect(link1?.installedPath).toBeNull();
		expect(link2?.installedPath).not.toBeNull();
	});
});

import { describe, expect, it, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import { Application } from "../Application.ts";
import { DownloadJobStatus } from "../application/enums/DownloadJobStatus.ts";
import { ExtractJobStatus } from "../application/enums/ExtractJobStatus.ts";
import type { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";
import { TestApplication } from "./TestApplication.ts";

const testFolder = mkdtempSync(join(tmpdir(), "dcs-dropzone__"));

const cases = [
	{ label: "TestApplication", app: new TestApplication() },
	{
		label: "Application",
		app: new Application({
			databaseUrl: ":memory:",
			wgetExecutablePath: "bin/wget.exe",
			sevenzipExecutablePath: "bin/7za.exe",
			dropzoneModsFolder: join(testFolder, "dcs-dropzone", "mods"),
			dcsPaths: {
				DCS_WORKING_DIR: join(testFolder, "dcs-dropzone", "dcs", "working"),
				DCS_INSTALL_DIR: join(testFolder, "dcs-dropzone", "dcs", "install"),
			},
		}),
	},
];

describe.each(cases)("$label addRelease", ({ app }) => {
	it("should add the release, assets, symlinks, mission scripts to the repository and create jobs", () => {
		const modAndReleaseData: ModAndReleaseData = {
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
					urls: [{ id: "test-release-id__asset-1__url-1", url: "http://example.com/asset.zip" }],
					isArchive: true,
				},
			],
			symbolicLinks: [
				{
					id: "symbolic-link-1",
					name: "Test Script",
					src: "TestMod/Scripts/test.lua",
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

		app.addRelease(modAndReleaseData);

		const allReleases = app.deps.releaseRepository.getAllReleases();
		const assetsForRelease = app.deps.releaseRepository.getReleaseAssetsForRelease(modAndReleaseData.releaseId);
		const symbolicLinksForRelease = app.deps.releaseRepository.getSymbolicLinksForRelease(modAndReleaseData.releaseId);
		const missionScriptsForRelease = app.deps.releaseRepository.getMissionScriptsForRelease(
			modAndReleaseData.releaseId,
		);
		const downloadJobs = app.deps.downloadQueue.getJobsForReleaseId(modAndReleaseData.releaseId);
		const extractJobs = app.deps.extractQueue.getJobsForReleaseId(modAndReleaseData.releaseId);

		expect(allReleases.length).toEqual(1);
		expect(allReleases[0]).toEqual({
			modId: "test-mod-id",
			modName: "Test Mod",
			releaseId: "test-release-id",
			version: "1.0.0",
			versionHash: modAndReleaseData.versionHash,
			dependencies: [],
		});

		expect(assetsForRelease.length).toEqual(modAndReleaseData.assets.length);
		expect(assetsForRelease[0]).toEqual({
			id: "test-release-id__asset-1",
			releaseId: "test-release-id",
			name: "Test Asset",
			isArchive: true,
			urls: [{ id: "test-release-id__asset-1__url-1", url: "http://example.com/asset.zip" }],
		});

		expect(symbolicLinksForRelease.length).toEqual(modAndReleaseData.symbolicLinks.length);
		expect(symbolicLinksForRelease[0]).toEqual({
			id: "symbolic-link-1",
			releaseId: "test-release-id",
			name: "Test Script",
			src: "TestMod/Scripts/test.lua",
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
		expect(downloadJobs[0]).toEqual({
			id: "download:test-release-id__asset-1__url-1",
			releaseId: "test-release-id",
			releaseAssetId: "test-release-id__asset-1",
			urlId: "test-release-id__asset-1__url-1",
			url: "http://example.com/asset.zip", // Download From
			targetDirectory: expect.stringMatching(/mods\/test-release-id$/), // Download To
			status: DownloadJobStatus.PENDING,
			attempt: 0,
			progressPercent: 0,
			nextAttemptAfter: expect.any(Date),
			createdAt: expect.any(Date),
		});

		expect(extractJobs.length).toEqual(1);
		expect(extractJobs[0]).toEqual({
			id: "extract:test-release-id__asset-1",
			releaseId: "test-release-id",
			releaseAssetId: "test-release-id__asset-1",
			archivePath: expect.stringMatching(/mods\/test-release-id\/asset\.zip$/), // Path to archive from a download job
			targetDirectory: expect.stringMatching(/mods\/test-release-id$/), // Extract to
			status: ExtractJobStatus.PENDING,
			attempt: 0,
			progressPercent: 0,
			nextAttemptAfter: expect.any(Date),
			createdAt: expect.any(Date),
		});
	});
});

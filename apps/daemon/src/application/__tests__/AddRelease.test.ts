import { describe, expect, it } from "bun:test";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import { Application } from "../Application.ts";
import { DownloadJobStatus } from "../enums/DownloadJobStatus.ts";
import { ExtractJobStatus } from "../enums/ExtractJobStatus.ts";
import type { ModAndReleaseData } from "../schemas/ModAndReleaseData.ts";
import { createTestApplicationContext } from "./createTestApplicationContext.ts";

describe("Application.addRelease", () => {
	it("should add the release, assets, symlinks, mission scripts to the repository and create jobs", () => {
		const c = createTestApplicationContext();

		const app = c.build();

		expect(app).toBeInstanceOf(Application);

		const modAndReleaseData: ModAndReleaseData = {
			releaseId: "test-release-id",
			modId: "test-mod-id",
			modName: "Test Mod",
			dependencies: [],
			version: "1.0.0",
			versionHash: Date.now().toString(),
			assets: [
				{
					name: "Test Asset",
					urls: ["http://example.com/asset.zip"],
					isArchive: true,
				},
			],
			symbolicLinks: [
				{
					name: "Test Script",
					src: "TestMod/Scripts/test.lua",
					dest: "Scripts/test.lua",
					destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				},
			],
			missionScripts: [
				{
					name: "Test Mission Script",
					purpose: "Testing mission script",
					path: "Scripts/test.lua",
					root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
					runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
				},
			],
		};

		app.addRelease(modAndReleaseData);

		const allReleases = c.releaseRepository.getAllReleases();
		const assetsForRelease = c.releaseRepository.getReleaseAssetsForRelease(modAndReleaseData.releaseId);
		const symbolicLinksForRelease = c.releaseRepository.getSymbolicLinksForRelease(modAndReleaseData.releaseId);
		const missionScriptsForRelease = c.releaseRepository.getMissionScriptsForRelease(modAndReleaseData.releaseId);
		const downloadJobs = c.downloadQueue.getJobsForReleaseId(modAndReleaseData.releaseId);
		const extractJobs = c.extractQueue.getJobsForReleaseId(modAndReleaseData.releaseId);

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
			id: "test-release-id:0",
			releaseId: "test-release-id",
			name: "Test Asset",
			isArchive: true,
			urls: ["http://example.com/asset.zip"],
		});

		expect(symbolicLinksForRelease.length).toEqual(modAndReleaseData.symbolicLinks.length);
		expect(symbolicLinksForRelease[0]).toEqual({
			id: "test-release-id:0",
			releaseId: "test-release-id",
			name: "Test Script",
			src: "TestMod/Scripts/test.lua",
			dest: "Scripts/test.lua",
			destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
			installedPath: null,
		});

		expect(missionScriptsForRelease.length).toEqual(modAndReleaseData.missionScripts.length);
		expect(missionScriptsForRelease[0]).toEqual({
			id: "test-release-id:0",
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
			id: "download:test-release-id:0:0",
			releaseId: "test-release-id",
			releaseAssetId: "test-release-id:0",
			url: "http://example.com/asset.zip", // Download From
			targetDirectory: "mods/test-release-id", // Download To
			status: DownloadJobStatus.PENDING,
			attempt: 0,
			progressPercent: 0,
			nextAttemptAfter: expect.any(Date),
			createdAt: expect.any(Date),
		});

		expect(extractJobs.length).toEqual(1);
		expect(extractJobs[0]).toEqual({
			id: "extract:test-release-id:0",
			releaseId: "test-release-id",
			releaseAssetId: "test-release-id:0",
			archivePath: "mods/test-release-id/asset.zip", // Path to archive from download job
			targetDirectory: "mods/test-release-id", // Extract to
			status: ExtractJobStatus.PENDING,
			attempt: 0,
			progressPercent: 0,
			nextAttemptAfter: expect.any(Date),
			createdAt: expect.any(Date),
		});
	});
});

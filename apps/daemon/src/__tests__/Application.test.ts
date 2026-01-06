import "./log4js.ts";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { ok } from "node:assert";
import { JobState } from "@packages/queue";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import type { Application } from "../application/Application.ts";
import type { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";
import { TestCases } from "./TestCases.ts";
import type { TestTempDir } from "./TestTempDir.ts";
import { waitForJobsForRelease } from "./utils.ts";

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
						{ id: "test-release-id__asset-1__url-1", url: "https://getsamplefiles.com/download/zip/sample-1.zip" },
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
			app.addRelease(modAndReleaseData);

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
			});

			expect(assetsForRelease.length).toEqual(modAndReleaseData.assets.length);
			expect(assetsForRelease[0]).toEqual({
				id: "test-release-id__asset-1",
				releaseId: "test-release-id",
				name: "Test Asset",
				isArchive: true,
				urls: [{ id: "test-release-id__asset-1__url-1", url: "https://getsamplefiles.com/download/zip/sample-1.zip" }],
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
			expect(downloadJobs[0]).toMatchObject({
				jobData: {
					url: "https://getsamplefiles.com/download/zip/sample-1.zip",
					destinationFolder: expect.stringMatching(/test-release-id$/),
					releaseId: "test-release-id",
					assetId: "test-release-id__asset-1",
					urlId: "test-release-id__asset-1__url-1",
				},
			});

			expect(extractJobs.length).toEqual(1);
			expect(extractJobs[0]).toMatchObject({
				jobData: {
					archivePath: expect.stringMatching(/sample-1\.zip$/),
					destinationFolder: expect.stringMatching(/test-release-id$/),
					releaseId: "test-release-id",
					assetId: "test-release-id__asset-1",
				},
			});
		});
	});

	describe("RemoveRelease", () => {
		it("should remove the release and all associated data from the repository", () => {
			app.addRelease(modAndReleaseData);
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
			app.addRelease(modAndReleaseData);

			await waitForJobsForRelease(app.deps, modAndReleaseData.releaseId, 5);

			const downloadJobs = app.deps.jobRecordRepository.findAllForProcessor("download");
			const extractJobs = app.deps.jobRecordRepository.findAllForProcessor("extract");

			expect(downloadJobs.length).toEqual(1);
			expect(extractJobs.length).toEqual(1);

			expect(downloadJobs[0]?.state).toEqual(JobState.Success);
			expect(extractJobs[0]?.state).toEqual(JobState.Success);

			app.enableRelease(modAndReleaseData.releaseId);

			const symbolicLinks = app.deps.releaseRepository.getSymbolicLinksForRelease(modAndReleaseData.releaseId);
			const symlinkInstalledPath = symbolicLinks[0]?.installedPath;
			ok(symlinkInstalledPath);
			expect(symlinkInstalledPath).toEndWith("test.lua");
		});
	});
});

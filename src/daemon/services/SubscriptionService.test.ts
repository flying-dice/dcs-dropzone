import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
	MissionScriptRunOn,
	SymbolicLinkDestRoot,
} from "../../common/data.ts";
import type { DownloadQueue } from "../queues/DownloadQueue.ts";
import type { SubscriptionRepository } from "../repositories/SubscriptionRepository.ts";
import type { ModReleaseData } from "../schemas/ModAndReleaseData.ts";
import type { ReleaseAssetService } from "./ReleaseAssetService.ts";
import {
	type ReleaseAssetServiceFactory,
	SubscriptionService,
} from "./SubscriptionService.ts";

describe("SubscriptionService", () => {
	let mockRepo: SubscriptionRepository;
	let mockDownloadQueue: Partial<DownloadQueue>;
	let mockReleaseAssetService: Partial<ReleaseAssetService>;
	let mockFactory: ReleaseAssetServiceFactory;
	let service: SubscriptionService;

	const testReleaseData: ModReleaseData = {
		modId: "test-mod",
		modName: "Test Mod",
		releaseId: "test-release-1",
		version: "1.0.0",
		dependencies: [],
		assets: [
			{
				name: "asset.zip",
				urls: ["https://example.com/asset.zip"],
				isArchive: true,
			},
		],
		symbolicLinks: [
			{
				name: "link-1",
				src: "/src",
				dest: "/dest",
				destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
			},
		],
		missionScripts: [
			{
				name: "script-1",
				purpose: "test",
				path: "/scripts/test.lua",
				root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
			},
		],
	};

	beforeEach(() => {
		// Create mock repository
		mockRepo = {
			getAll: mock(() => [
				{ modId: "mod-1", releaseId: "release-1" },
				{ modId: "mod-2", releaseId: "release-2" },
			]),
			saveRelease: mock(() => {}),
			deleteByReleaseId: mock(() => {}),
		};

		// Create mock download queue
		mockDownloadQueue = {
			cancelJobsForRelease: mock(() => {}),
		};

		// Create mock ReleaseAssetService
		mockReleaseAssetService = {
			downloadAndExtractReleaseAssets: mock(() => Promise.resolve()),
			removeReleaseAssetsAndFolder: mock(() => Promise.resolve()),
		};

		// Create mock factory
		mockFactory = mock(() => mockReleaseAssetService as ReleaseAssetService);

		// Create service instance
		service = new SubscriptionService(
			mockRepo,
			mockDownloadQueue as DownloadQueue,
			mockFactory,
		);
	});

	it("should return all subscriptions", () => {
		const subscriptions = service.getAllSubscriptions();

		expect(subscriptions).toEqual([
			{ modId: "mod-1", releaseId: "release-1" },
			{ modId: "mod-2", releaseId: "release-2" },
		]);
		expect(mockRepo.getAll).toHaveBeenCalledTimes(1);
	});

	it("should subscribe to a release", () => {
		service.subscribeToRelease(testReleaseData);

		// Verify repository was called to save the release
		expect(mockRepo.saveRelease).toHaveBeenCalledTimes(1);
		expect(mockRepo.saveRelease).toHaveBeenCalledWith(testReleaseData);

		// Verify factory was called with the release ID
		expect(mockFactory).toHaveBeenCalledTimes(1);
		expect(mockFactory).toHaveBeenCalledWith(testReleaseData.releaseId);

		// Verify download and extract was initiated
		expect(
			mockReleaseAssetService.downloadAndExtractReleaseAssets,
		).toHaveBeenCalledTimes(1);
	});

	it("should remove subscription", async () => {
		const releaseId = "release-to-remove";

		await service.removeSubscription(releaseId);

		// Verify download queue jobs were cancelled
		expect(mockDownloadQueue.cancelJobsForRelease).toHaveBeenCalledTimes(1);
		expect(mockDownloadQueue.cancelJobsForRelease).toHaveBeenCalledWith(
			releaseId,
		);

		// Verify factory was called to create ReleaseAssetService
		expect(mockFactory).toHaveBeenCalledTimes(1);
		expect(mockFactory).toHaveBeenCalledWith(releaseId);

		// Verify release assets and folder were removed
		expect(
			mockReleaseAssetService.removeReleaseAssetsAndFolder,
		).toHaveBeenCalledTimes(1);

		// Verify repository was called to delete the subscription
		expect(mockRepo.deleteByReleaseId).toHaveBeenCalledTimes(1);
		expect(mockRepo.deleteByReleaseId).toHaveBeenCalledWith(releaseId);
	});

	it("should return empty array when no subscriptions exist", () => {
		mockRepo.getAll = mock(() => []);

		const subscriptions = service.getAllSubscriptions();

		expect(subscriptions).toEqual([]);
	});
});

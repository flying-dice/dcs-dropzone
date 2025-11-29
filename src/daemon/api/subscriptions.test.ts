import { beforeEach, describe, expect, it, mock, type Mock } from "bun:test";
import { StatusCodes } from "http-status-codes";
import {
	MissionScriptRunOn,
	SymbolicLinkDestRoot,
} from "../../common/data.ts";
import type { DownloadQueue } from "../queues/DownloadQueue.ts";
import type { ModReleaseData } from "../schemas/ModAndReleaseData.ts";
import type { SubscriptionService } from "../services/SubscriptionService.ts";
import { createSubscriptionsRouter } from "./subscriptions.ts";

describe("Subscriptions API Router", () => {
	let mockSubscriptionService: {
		getAllSubscriptions: Mock<() => { modId: string; releaseId: string }[]>;
		subscribeToRelease: Mock<(data: ModReleaseData) => void>;
		removeSubscription: Mock<(releaseId: string) => Promise<void>>;
	};
	let mockDownloadQueue: {
		getOverallProgressForRelease: Mock<(releaseId: string) => number>;
	};
	let router: ReturnType<typeof createSubscriptionsRouter>;

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
		mockSubscriptionService = {
			getAllSubscriptions: mock(() => [
				{ modId: "mod-1", releaseId: "release-1" },
				{ modId: "mod-2", releaseId: "release-2" },
			]),
			subscribeToRelease: mock(() => {}),
			removeSubscription: mock(() => Promise.resolve()),
		};

		mockDownloadQueue = {
			getOverallProgressForRelease: mock((releaseId: string) =>
				releaseId === "release-1" ? 50 : 100,
			),
		};

		router = createSubscriptionsRouter({
			subscriptionService: mockSubscriptionService as unknown as SubscriptionService,
			downloadQueue: mockDownloadQueue as unknown as DownloadQueue,
		});
	});

	it("GET / should return all subscriptions with progress", async () => {
		const response = await router.request("/");

		expect(response.status).toBe(StatusCodes.OK);
		const body = await response.json();
		expect(body).toEqual([
			{ modId: "mod-1", releaseId: "release-1", progressPercent: 50 },
			{ modId: "mod-2", releaseId: "release-2", progressPercent: 100 },
		]);

		expect(mockSubscriptionService.getAllSubscriptions).toHaveBeenCalledTimes(1);
		expect(mockDownloadQueue.getOverallProgressForRelease).toHaveBeenCalledTimes(2);
	});

	it("POST / should subscribe to a release", async () => {
		const response = await router.request("/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(testReleaseData),
		});

		expect(response.status).toBe(StatusCodes.OK);
		expect(mockSubscriptionService.subscribeToRelease).toHaveBeenCalledTimes(1);
		expect(mockSubscriptionService.subscribeToRelease).toHaveBeenCalledWith(
			testReleaseData,
		);
	});

	it("DELETE /:releaseId should remove subscription", async () => {
		const response = await router.request("/test-release-1", {
			method: "DELETE",
		});

		expect(response.status).toBe(StatusCodes.OK);
		expect(mockSubscriptionService.removeSubscription).toHaveBeenCalledTimes(1);
		expect(mockSubscriptionService.removeSubscription).toHaveBeenCalledWith(
			"test-release-1",
		);
	});

	it("GET / should return empty array when no subscriptions exist", async () => {
		mockSubscriptionService.getAllSubscriptions = mock(() => []);

		const response = await router.request("/");

		expect(response.status).toBe(StatusCodes.OK);
		const body = await response.json();
		expect(body).toEqual([]);
	});
});

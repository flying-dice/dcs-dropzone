import { beforeEach, describe, expect, it } from "bun:test";
import { MissionScriptRunOn, SymbolicLinkDestRoot } from "../../common/data.ts";
import type { SubscriptionRepository } from "../repositories/SubscriptionRepository.ts";
import type { ModReleaseData } from "../schemas/ModAndReleaseData.ts";
import type { ReleaseAssetService } from "./ReleaseAssetService.ts";
import {
	type ReleaseAssetServiceFactory,
	SubscriptionService,
} from "./SubscriptionService.ts";

// Test doubles (local classes) using plain objects
class TestSubscriptionRepository implements SubscriptionRepository {
	private subscriptions: { modId: string; releaseId: string }[];
	public lastSaved?: ModReleaseData;
	public deleted: string[] = [];

	constructor(initial: { modId: string; releaseId: string }[] = []) {
		this.subscriptions = [...initial];
	}

	getAll(): { modId: string; releaseId: string }[] {
		return [...this.subscriptions];
	}

	saveRelease(data: ModReleaseData): void {
		this.lastSaved = data;
		this.subscriptions.push({ modId: data.modId, releaseId: data.releaseId });
	}

	deleteByReleaseId(releaseId: string): void {
		this.deleted.push(releaseId);
		this.subscriptions = this.subscriptions.filter(
			(s) => s.releaseId !== releaseId,
		);
	}

	setAll(subs: { modId: string; releaseId: string }[]): void {
		this.subscriptions = [...subs];
	}
}

class TestReleaseAssetService {
	public downloadCount = 0;
	public removeCount = 0;
	async downloadAndExtractReleaseAssets(): Promise<void> {
		this.downloadCount++;
	}
	async removeReleaseAssetsAndFolder(): Promise<void> {
		this.removeCount++;
	}
}

type FactoryState = { callCount: number; lastReleaseId?: string };
function makeFactory(service: TestReleaseAssetService): {
	factory: ReleaseAssetServiceFactory;
	state: FactoryState;
} {
	const state: FactoryState = { callCount: 0 };
	const factory: ReleaseAssetServiceFactory = (releaseId: string) => {
		state.callCount++;
		state.lastReleaseId = releaseId;
		return service as unknown as ReleaseAssetService;
	};
	return { factory, state };
}

describe("SubscriptionService", () => {
	let repo: TestSubscriptionRepository;
	let raService: TestReleaseAssetService;
	let factory: ReleaseAssetServiceFactory;
	let factoryState: FactoryState;
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
		repo = new TestSubscriptionRepository([
			{ modId: "mod-1", releaseId: "release-1" },
			{ modId: "mod-2", releaseId: "release-2" },
		]);
		raService = new TestReleaseAssetService();
		({ factory, state: factoryState } = makeFactory(raService));
		service = new SubscriptionService(repo, factory);
	});

	it("should return all subscriptions", () => {
		const subscriptions = service.getAllSubscriptions();

		expect(subscriptions).toEqual([
			{ modId: "mod-1", releaseId: "release-1" },
			{ modId: "mod-2", releaseId: "release-2" },
		]);
	});

	it("should subscribe to a release", () => {
		service.subscribeToRelease(testReleaseData);

		// Verify repository saved the release
		expect(repo.lastSaved).toEqual(testReleaseData);
		// Verify factory usage
		expect(factoryState.callCount).toBe(1);
		expect(factoryState.lastReleaseId).toBe(testReleaseData.releaseId);
		// Verify download and extract was initiated
		expect(raService.downloadCount).toBe(1);
	});

	it("should remove subscription", async () => {
		const releaseId = "release-to-remove";

		await service.removeSubscription(releaseId);

		// Verify factory was called and remove executed
		expect(factoryState.callCount).toBe(1);
		expect(factoryState.lastReleaseId).toBe(releaseId);
		expect(raService.removeCount).toBe(1);

		// Verify repository delete
		expect(repo.deleted).toEqual([releaseId]);
	});

	it("should return empty array when no subscriptions exist", () => {
		repo.setAll([]);
		const subscriptions = service.getAllSubscriptions();
		expect(subscriptions).toEqual([]);
	});
});

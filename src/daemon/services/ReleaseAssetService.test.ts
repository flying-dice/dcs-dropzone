import { beforeEach, describe, expect, it } from "bun:test";
import type { DownloadQueue } from "../queues/DownloadQueue.ts";
import type { ExtractQueue } from "../queues/ExtractQueue.ts";
import type {
	ReleaseAsset,
	ReleaseAssetRepository,
	ReleaseData,
} from "../repositories/ReleaseAssetRepository.ts";
import { ReleaseAssetService } from "./ReleaseAssetService.ts";

// Test doubles (local classes)
class TestReleaseAssetRepository implements ReleaseAssetRepository {
	public lastGetReleaseByIdArg?: string;
	constructor(
		private releases: Record<string, ReleaseData>,
		private assetsByRelease: Record<string, ReleaseAsset[]>,
	) {}
	getReleaseById(releaseId: string): ReleaseData | undefined {
		this.lastGetReleaseByIdArg = releaseId;
		return this.releases[releaseId];
	}
	getAssetsForRelease(releaseId: string): ReleaseAsset[] {
		return this.assetsByRelease[releaseId] ?? [];
	}
}

class TestDownloadQueue {
	public pushedJobs: Array<{
		releaseId: string;
		releaseAssetId: string;
		id: string;
		url: string;
		targetDirectory: string;
	}> = [];
	public cancelledFor: string[] = [];
	pushJob(
		releaseId: string,
		releaseAssetId: string,
		id: string,
		url: string,
		targetDirectory: string,
	): void {
		this.pushedJobs.push({
			releaseId,
			releaseAssetId,
			id,
			url,
			targetDirectory,
		});
	}
	cancelJobsForRelease(releaseId: string): void {
		this.cancelledFor.push(releaseId);
	}
}

class TestExtractQueue {
	public pushedJobs: Array<{
		releaseId: string;
		releaseAssetId: string;
		id: string;
		archivePath: string;
		targetDirectory: string;
		downloadJobIds: string[];
	}> = [];
	public cancelledFor: string[] = [];
	pushJob(
		releaseId: string,
		releaseAssetId: string,
		id: string,
		archivePath: string,
		targetDirectory: string,
		downloadJobIds: string[],
	): void {
		this.pushedJobs.push({
			releaseId,
			releaseAssetId,
			id,
			archivePath,
			targetDirectory,
			downloadJobIds,
		});
	}
	cancelJobsForRelease(releaseId: string): void {
		this.cancelledFor.push(releaseId);
	}
}

describe("ReleaseAssetService", () => {
	let repo: TestReleaseAssetRepository;
	let dlq: TestDownloadQueue;
	let exq: TestExtractQueue;

	const testRelease: ReleaseData = {
		releaseId: "test-release-1",
		modId: "test-mod",
		modName: "Test Mod",
		version: "1.0.0",
	};

	const testAssets: ReleaseAsset[] = [
		{
			id: "asset-1",
			releaseId: "test-release-1",
			name: "test.zip",
			isArchive: true,
			urls: ["https://example.com/test.zip"],
		},
		{
			id: "asset-2",
			releaseId: "test-release-1",
			name: "readme.txt",
			isArchive: false,
			urls: ["https://example.com/readme.txt"],
		},
	];

	beforeEach(() => {
		repo = new TestReleaseAssetRepository(
			{ [testRelease.releaseId]: testRelease },
			{ [testRelease.releaseId]: testAssets },
		);
		dlq = new TestDownloadQueue();
		exq = new TestExtractQueue();
	});

	it("should throw error when release is not found", () => {
		expect(() => {
			new ReleaseAssetService(
				"non-existent-release",
				new TestReleaseAssetRepository({}, {}),
				dlq as unknown as DownloadQueue,
				exq as unknown as ExtractQueue,
			);
		}).toThrow("Release with ID non-existent-release not found in database.");
	});

	it("should create service instance for valid release", () => {
		const service = new ReleaseAssetService(
			"test-release-1",
			repo,
			dlq as unknown as DownloadQueue,
			exq as unknown as ExtractQueue,
		);

		expect(service).toBeDefined();
		expect(repo.lastGetReleaseByIdArg).toEqual("test-release-1");
	});

	it("should push download jobs for each asset url", async () => {
		const service = new ReleaseAssetService(
			"test-release-1",
			repo,
			dlq as unknown as DownloadQueue,
			exq as unknown as ExtractQueue,
		);

		await service.downloadAndExtractReleaseAssets();

		// Should push download jobs for each URL in each asset
		expect(dlq.pushedJobs.length).toBe(2); // 2 assets, 1 URL each
	});

	it("should push extract job for archive assets", async () => {
		const service = new ReleaseAssetService(
			"test-release-1",
			repo,
			dlq as unknown as DownloadQueue,
			exq as unknown as ExtractQueue,
		);

		await service.downloadAndExtractReleaseAssets();

		// Should push extract job only for the archive asset
		expect(exq.pushedJobs.length).toBe(1);
	});

	it("should cancel download and extract jobs when removing release assets", async () => {
		const service = new ReleaseAssetService(
			"test-release-1",
			repo,
			dlq as unknown as DownloadQueue,
			exq as unknown as ExtractQueue,
		);

		await service.removeReleaseAssetsAndFolder();

		expect(dlq.cancelledFor).toEqual(["test-release-1"]);
		expect(exq.cancelledFor).toEqual(["test-release-1"]);
	});

	it("should not push extract job for non-archive assets", async () => {
		// Override to return only non-archive assets
		repo = new TestReleaseAssetRepository(
			{ [testRelease.releaseId]: testRelease },
			{
				[testRelease.releaseId]: [
					{
						id: "asset-2",
						releaseId: "test-release-1",
						name: "readme.txt",
						isArchive: false,
						urls: ["https://example.com/readme.txt"],
					},
				],
			},
		);

		const service = new ReleaseAssetService(
			"test-release-1",
			repo,
			dlq as unknown as DownloadQueue,
			exq as unknown as ExtractQueue,
		);

		await service.downloadAndExtractReleaseAssets();

		// Should not push any extract jobs for non-archive assets
		expect(exq.pushedJobs.length).toBe(0);
	});

	it("should handle assets with no URLs gracefully", async () => {
		// Override to return assets with no URLs
		repo = new TestReleaseAssetRepository(
			{ [testRelease.releaseId]: testRelease },
			{
				[testRelease.releaseId]: [
					{
						id: "asset-empty",
						releaseId: "test-release-1",
						name: "empty.zip",
						isArchive: true,
						urls: [],
					},
				],
			},
		);

		const service = new ReleaseAssetService(
			"test-release-1",
			repo,
			dlq as unknown as DownloadQueue,
			exq as unknown as ExtractQueue,
		);

		await service.downloadAndExtractReleaseAssets();

		// No download jobs should be pushed for assets with no URLs
		expect(dlq.pushedJobs.length).toBe(0);
		// No extract jobs should be pushed for archives with no URLs
		expect(exq.pushedJobs.length).toBe(0);
	});

	it("should handle multipart archives", async () => {
		// Override to return multipart archive asset
		repo = new TestReleaseAssetRepository(
			{ [testRelease.releaseId]: testRelease },
			{
				[testRelease.releaseId]: [
					{
						id: "asset-multipart",
						releaseId: "test-release-1",
						name: "multipart.7z.001",
						isArchive: true,
						urls: [
							"https://example.com/multipart.7z.001",
							"https://example.com/multipart.7z.002",
							"https://example.com/multipart.7z.003",
						],
					},
				],
			},
		);

		const service = new ReleaseAssetService(
			"test-release-1",
			repo,
			dlq as unknown as DownloadQueue,
			exq as unknown as ExtractQueue,
		);

		await service.downloadAndExtractReleaseAssets();

		// Should push download jobs for all 3 parts
		expect(dlq.pushedJobs.length).toBe(3);
		// Should push one extract job for the multipart archive
		expect(exq.pushedJobs.length).toBe(1);
	});
});

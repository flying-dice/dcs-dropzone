import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { DownloadQueue } from "../queues/DownloadQueue.ts";
import type { ExtractQueue } from "../queues/ExtractQueue.ts";
import type {
	ReleaseAsset,
	ReleaseAssetRepository,
	ReleaseData,
} from "../repositories/ReleaseAssetRepository.ts";
import { ReleaseAssetService } from "./ReleaseAssetService.ts";

describe("ReleaseAssetService", () => {
	let mockRepository: ReleaseAssetRepository;
	let mockDownloadQueue: Partial<DownloadQueue>;
	let mockExtractQueue: Partial<ExtractQueue>;

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
		mockRepository = {
			getReleaseById: mock((releaseId: string) => {
				if (releaseId === "test-release-1") {
					return testRelease;
				}
				return undefined;
			}),
			getAssetsForRelease: mock((_releaseId: string) => testAssets),
		};

		mockDownloadQueue = {
			pushJob: mock(() => {}),
			cancelJobsForRelease: mock(() => {}),
		};

		mockExtractQueue = {
			pushJob: mock(() => {}),
			cancelJobsForRelease: mock(() => {}),
		};
	});

	it("should throw error when release is not found", () => {
		expect(() => {
			new ReleaseAssetService(
				"non-existent-release",
				mockRepository,
				mockDownloadQueue as DownloadQueue,
				mockExtractQueue as ExtractQueue,
			);
		}).toThrow("Release with ID non-existent-release not found in database.");
	});

	it("should create service instance for valid release", () => {
		const service = new ReleaseAssetService(
			"test-release-1",
			mockRepository,
			mockDownloadQueue as DownloadQueue,
			mockExtractQueue as ExtractQueue,
		);

		expect(service).toBeDefined();
		expect(mockRepository.getReleaseById).toHaveBeenCalledWith("test-release-1");
	});

	it("should push download jobs for each asset url", async () => {
		const service = new ReleaseAssetService(
			"test-release-1",
			mockRepository,
			mockDownloadQueue as DownloadQueue,
			mockExtractQueue as ExtractQueue,
		);

		await service.downloadAndExtractReleaseAssets();

		// Should push download jobs for each URL in each asset
		expect(mockDownloadQueue.pushJob).toHaveBeenCalledTimes(2); // 2 assets, 1 URL each
	});

	it("should push extract job for archive assets", async () => {
		const service = new ReleaseAssetService(
			"test-release-1",
			mockRepository,
			mockDownloadQueue as DownloadQueue,
			mockExtractQueue as ExtractQueue,
		);

		await service.downloadAndExtractReleaseAssets();

		// Should push extract job only for the archive asset
		expect(mockExtractQueue.pushJob).toHaveBeenCalledTimes(1);
	});

	it("should cancel extract jobs when removing release assets", async () => {
		const service = new ReleaseAssetService(
			"test-release-1",
			mockRepository,
			mockDownloadQueue as DownloadQueue,
			mockExtractQueue as ExtractQueue,
		);

		await service.removeReleaseAssetsAndFolder();

		expect(mockExtractQueue.cancelJobsForRelease).toHaveBeenCalledTimes(1);
		expect(mockExtractQueue.cancelJobsForRelease).toHaveBeenCalledWith(
			"test-release-1",
		);
	});

	it("should not push extract job for non-archive assets", async () => {
		// Override to return only non-archive assets
		mockRepository.getAssetsForRelease = mock(() => [
			{
				id: "asset-2",
				releaseId: "test-release-1",
				name: "readme.txt",
				isArchive: false,
				urls: ["https://example.com/readme.txt"],
			},
		]);

		const service = new ReleaseAssetService(
			"test-release-1",
			mockRepository,
			mockDownloadQueue as DownloadQueue,
			mockExtractQueue as ExtractQueue,
		);

		await service.downloadAndExtractReleaseAssets();

		// Should not push any extract jobs for non-archive assets
		expect(mockExtractQueue.pushJob).toHaveBeenCalledTimes(0);
	});

	it("should handle assets with no URLs gracefully", async () => {
		// Override to return assets with no URLs
		mockRepository.getAssetsForRelease = mock(() => [
			{
				id: "asset-empty",
				releaseId: "test-release-1",
				name: "empty.zip",
				isArchive: true,
				urls: [],
			},
		]);

		const service = new ReleaseAssetService(
			"test-release-1",
			mockRepository,
			mockDownloadQueue as DownloadQueue,
			mockExtractQueue as ExtractQueue,
		);

		await service.downloadAndExtractReleaseAssets();

		// No download jobs should be pushed for assets with no URLs
		expect(mockDownloadQueue.pushJob).toHaveBeenCalledTimes(0);
		// No extract jobs should be pushed for archives with no URLs
		expect(mockExtractQueue.pushJob).toHaveBeenCalledTimes(0);
	});

	it("should handle multipart archives", async () => {
		// Override to return multipart archive asset
		mockRepository.getAssetsForRelease = mock(() => [
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
		]);

		const service = new ReleaseAssetService(
			"test-release-1",
			mockRepository,
			mockDownloadQueue as DownloadQueue,
			mockExtractQueue as ExtractQueue,
		);

		await service.downloadAndExtractReleaseAssets();

		// Should push download jobs for all 3 parts
		expect(mockDownloadQueue.pushJob).toHaveBeenCalledTimes(3);
		// Should push one extract job for the multipart archive
		expect(mockExtractQueue.pushJob).toHaveBeenCalledTimes(1);
	});
});

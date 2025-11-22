import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { pathExistsSync } from "fs-extra";
import { AssetStatus } from "../../common/data.ts";
import { db } from "../database";
import { T_MOD_RELEASE_ASSETS, T_MOD_RELEASES } from "../database/schema.ts";
import { ReleaseDownloadService } from "./ReleaseDownloadService.ts";
import { SevenzipService } from "./SevenzipService.ts";
import { WgetService } from "./WgetService.ts";

describe("ReleaseDownloadService", () => {
	const testReleaseId = "test-release-123";
	const testFolder = join(process.cwd(), testReleaseId);

	beforeEach(() => {
		// Clean up test folder
		if (pathExistsSync(testFolder)) {
			rmSync(testFolder, { recursive: true, force: true });
		}

		// Insert test release
		db.insert(T_MOD_RELEASES)
			.values({
				releaseId: testReleaseId,
				modId: "test-mod-1",
				modName: "Test Mod",
				version: "1.0.0",
			})
			.run();
	});

	afterEach(() => {
		// Clean up test data
		db.delete(T_MOD_RELEASE_ASSETS).run();
		db.delete(T_MOD_RELEASES).run();

		// Clean up test folder
		if (pathExistsSync(testFolder)) {
			rmSync(testFolder, { recursive: true, force: true });
		}
	});

	test("should create release folder in CWD", async () => {
		// Insert test asset
		db.insert(T_MOD_RELEASE_ASSETS)
			.values({
				id: `${testReleaseId}:0`,
				releaseId: testReleaseId,
				name: "Test Asset",
				isArchive: false,
				urls: ["http://ipv4.download.thinkbroadband.com/5MB.zip"],
			})
			.run();

		const wgetService = new WgetService({
			exePath: "binaries/wget.exe",
		});
		const sevenzipService = new SevenzipService({
			exePath: "binaries/7za.exe",
		});

		const service = new ReleaseDownloadService({
			wgetService,
			sevenzipService,
		});

		await service.downloadAndExtractRelease(testReleaseId);

		expect(pathExistsSync(testFolder)).toBe(true);
	});

	test("should download all asset URLs", async () => {
		// Insert test asset with multiple URLs
		db.insert(T_MOD_RELEASE_ASSETS)
			.values({
				id: `${testReleaseId}:0`,
				releaseId: testReleaseId,
				name: "Multi-URL Asset",
				isArchive: false,
				urls: [
					"http://ipv4.download.thinkbroadband.com/5MB.zip",
					"http://ipv4.download.thinkbroadband.com/10MB.zip",
				],
			})
			.run();

		const wgetService = new WgetService({
			exePath: "binaries/wget.exe",
		});
		const sevenzipService = new SevenzipService({
			exePath: "binaries/7za.exe",
		});

		const service = new ReleaseDownloadService({
			wgetService,
			sevenzipService,
		});

		await service.downloadAndExtractRelease(testReleaseId);

		// Check that both files were downloaded
		expect(pathExistsSync(join(testFolder, "5MB.zip"))).toBe(true);
		expect(pathExistsSync(join(testFolder, "10MB.zip"))).toBe(true);
	});

	test("should update asset status to DOWNLOADED after download", async () => {
		const assetId = `${testReleaseId}:0`;

		db.insert(T_MOD_RELEASE_ASSETS)
			.values({
				id: assetId,
				releaseId: testReleaseId,
				name: "Test Asset",
				isArchive: false,
				urls: ["http://ipv4.download.thinkbroadband.com/5MB.zip"],
			})
			.run();

		const wgetService = new WgetService({
			exePath: "binaries/wget.exe",
		});
		const sevenzipService = new SevenzipService({
			exePath: "binaries/7za.exe",
		});

		const service = new ReleaseDownloadService({
			wgetService,
			sevenzipService,
		});

		await service.downloadAndExtractRelease(testReleaseId);

		const asset = db
			.select()
			.from(T_MOD_RELEASE_ASSETS)
			.where(eq(T_MOD_RELEASE_ASSETS.id, assetId))
			.get();

		expect(asset?.status).toBe(AssetStatus.DOWNLOADED);
	});

	test("should extract archives and create log files", async () => {
		const assetId = `${testReleaseId}:0`;

		db.insert(T_MOD_RELEASE_ASSETS)
			.values({
				id: assetId,
				releaseId: testReleaseId,
				name: "Archive Asset",
				isArchive: true,
				urls: ["http://ipv4.download.thinkbroadband.com/5MB.zip"],
			})
			.run();

		const wgetService = new WgetService({
			exePath: "binaries/wget.exe",
		});
		const sevenzipService = new SevenzipService({
			exePath: "binaries/7za.exe",
		});

		const service = new ReleaseDownloadService({
			wgetService,
			sevenzipService,
		});

		await service.downloadAndExtractRelease(testReleaseId);

		// Check that log file was created
		const logFilePath = join(testFolder, "5MB.zip.log");
		expect(pathExistsSync(logFilePath)).toBe(true);

		// Check that log file contains progress information
		const logContent = readFileSync(logFilePath, "utf-8");
		expect(logContent).toContain("Extraction progress");
	});

	test("should update asset status to EXTRACTED after extraction", async () => {
		const assetId = `${testReleaseId}:0`;

		db.insert(T_MOD_RELEASE_ASSETS)
			.values({
				id: assetId,
				releaseId: testReleaseId,
				name: "Archive Asset",
				isArchive: true,
				urls: ["http://ipv4.download.thinkbroadband.com/5MB.zip"],
			})
			.run();

		const wgetService = new WgetService({
			exePath: "binaries/wget.exe",
		});
		const sevenzipService = new SevenzipService({
			exePath: "binaries/7za.exe",
		});

		const service = new ReleaseDownloadService({
			wgetService,
			sevenzipService,
		});

		await service.downloadAndExtractRelease(testReleaseId);

		const asset = db
			.select()
			.from(T_MOD_RELEASE_ASSETS)
			.where(eq(T_MOD_RELEASE_ASSETS.id, assetId))
			.get();

		expect(asset?.status).toBe(AssetStatus.EXTRACTED);
	});

	test("should not delete archives after extraction", async () => {
		const assetId = `${testReleaseId}:0`;

		db.insert(T_MOD_RELEASE_ASSETS)
			.values({
				id: assetId,
				releaseId: testReleaseId,
				name: "Archive Asset",
				isArchive: true,
				urls: ["http://ipv4.download.thinkbroadband.com/5MB.zip"],
			})
			.run();

		const wgetService = new WgetService({
			exePath: "binaries/wget.exe",
		});
		const sevenzipService = new SevenzipService({
			exePath: "binaries/7za.exe",
		});

		const service = new ReleaseDownloadService({
			wgetService,
			sevenzipService,
		});

		await service.downloadAndExtractRelease(testReleaseId);

		// Check that archive still exists
		const archivePath = join(testFolder, "5MB.zip");
		expect(pathExistsSync(archivePath)).toBe(true);
	});

	test("should handle releases with no assets", async () => {
		const wgetService = new WgetService({
			exePath: "binaries/wget.exe",
		});
		const sevenzipService = new SevenzipService({
			exePath: "binaries/7za.exe",
		});

		const service = new ReleaseDownloadService({
			wgetService,
			sevenzipService,
		});

		// Should not throw error
		await expect(
			service.downloadAndExtractRelease(testReleaseId),
		).resolves.toBeUndefined();
	});

	test("should handle releases with only non-archive assets", async () => {
		db.insert(T_MOD_RELEASE_ASSETS)
			.values({
				id: `${testReleaseId}:0`,
				releaseId: testReleaseId,
				name: "Non-Archive Asset",
				isArchive: false,
				urls: ["http://ipv4.download.thinkbroadband.com/5MB.zip"],
			})
			.run();

		const wgetService = new WgetService({
			exePath: "binaries/wget.exe",
		});
		const sevenzipService = new SevenzipService({
			exePath: "binaries/7za.exe",
		});

		const service = new ReleaseDownloadService({
			wgetService,
			sevenzipService,
		});

		await service.downloadAndExtractRelease(testReleaseId);

		const asset = db
			.select()
			.from(T_MOD_RELEASE_ASSETS)
			.where(eq(T_MOD_RELEASE_ASSETS.id, `${testReleaseId}:0`))
			.get();

		// Should only be DOWNLOADED, not EXTRACTED
		expect(asset?.status).toBe(AssetStatus.DOWNLOADED);
	});

	test("should set status to DOWNLOAD_FAILED on download error", async () => {
		const assetId = `${testReleaseId}:0`;

		db.insert(T_MOD_RELEASE_ASSETS)
			.values({
				id: assetId,
				releaseId: testReleaseId,
				name: "Failed Asset",
				isArchive: false,
				urls: ["http://ipv4.download.thinkbroadband.com/404.zip"],
			})
			.run();

		const wgetService = new WgetService({
			exePath: "binaries/wget.exe",
		});
		const sevenzipService = new SevenzipService({
			exePath: "binaries/7za.exe",
		});

		const service = new ReleaseDownloadService({
			wgetService,
			sevenzipService,
		});

		await expect(
			service.downloadAndExtractRelease(testReleaseId),
		).rejects.toThrow();

		const asset = db
			.select()
			.from(T_MOD_RELEASE_ASSETS)
			.where(eq(T_MOD_RELEASE_ASSETS.id, assetId))
			.get();

		expect(asset?.status).toBe(AssetStatus.DOWNLOAD_FAILED);
	});
});

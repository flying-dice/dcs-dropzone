import { describe, expect, it } from "bun:test";
import { AssetStatus } from "../enums/AssetStatus.ts";
import { DownloadedReleaseStatus } from "../enums/DownloadedReleaseStatus.ts";
import { inferReleaseStatusFromAssets } from "./inferReleaseStatusFromAssets.ts";

describe("inferReleaseStatusFromAssets", () => {
	it("returns PENDING when all assets are PENDING", () => {
		const assetStatus = [AssetStatus.PENDING, AssetStatus.PENDING];
		const symbolicLinksData = [{ installedPath: null }, { installedPath: null }];

		const result = inferReleaseStatusFromAssets(assetStatus, symbolicLinksData);
		expect(result).toBe(DownloadedReleaseStatus.PENDING);
	});

	it("returns PENDING when all assets are PENDING even with installed paths", () => {
		const assetStatus = [AssetStatus.PENDING, AssetStatus.PENDING];
		const symbolicLinksData = [{ installedPath: "/path/1" }, { installedPath: "/path/2" }];

		const result = inferReleaseStatusFromAssets(assetStatus, symbolicLinksData);
		expect(result).toBe(DownloadedReleaseStatus.PENDING);
	});

	it("returns ERROR when any asset has ERROR status", () => {
		const assetStatus = [AssetStatus.COMPLETED, AssetStatus.ERROR];
		const symbolicLinksData = [{ installedPath: "/path/1" }, { installedPath: "/path/2" }];

		const result = inferReleaseStatusFromAssets(assetStatus, symbolicLinksData);
		expect(result).toBe(DownloadedReleaseStatus.ERROR);
	});

	it("returns ERROR when the first asset has ERROR status", () => {
		const assetStatus = [AssetStatus.ERROR, AssetStatus.COMPLETED];
		const symbolicLinksData = [{ installedPath: null }, { installedPath: null }];

		const result = inferReleaseStatusFromAssets(assetStatus, symbolicLinksData);
		expect(result).toBe(DownloadedReleaseStatus.ERROR);
	});

	it("returns ENABLED when all assets are COMPLETED and all symlinks have installed paths", () => {
		const assetStatus = [AssetStatus.COMPLETED, AssetStatus.COMPLETED];
		const symbolicLinksData = [{ installedPath: "/path/1" }, { installedPath: "/path/2" }];

		const result = inferReleaseStatusFromAssets(assetStatus, symbolicLinksData);
		expect(result).toBe(DownloadedReleaseStatus.ENABLED);
	});

	it("returns DISABLED when all assets are COMPLETED but no symlinks have installed paths", () => {
		const assetStatus = [AssetStatus.COMPLETED, AssetStatus.COMPLETED];
		const symbolicLinksData = [{ installedPath: null }, { installedPath: null }];

		const result = inferReleaseStatusFromAssets(assetStatus, symbolicLinksData);
		expect(result).toBe(DownloadedReleaseStatus.DISABLED);
	});

	it("returns DISABLED when all assets are COMPLETED but only some symlinks have installed paths", () => {
		const assetStatus = [AssetStatus.COMPLETED, AssetStatus.COMPLETED];
		const symbolicLinksData = [{ installedPath: "/path/1" }, { installedPath: null }];

		const result = inferReleaseStatusFromAssets(assetStatus, symbolicLinksData);
		expect(result).toBe(DownloadedReleaseStatus.DISABLED);
	});

	it("returns ENABLED when all assets are COMPLETED and symbolicLinksData is empty", () => {
		const assetStatus = [AssetStatus.COMPLETED, AssetStatus.COMPLETED];
		const symbolicLinksData: { installedPath: string | null }[] = [];

		const result = inferReleaseStatusFromAssets(assetStatus, symbolicLinksData);
		// Empty array means .every() returns true (vacuously true), so status is ENABLED
		expect(result).toBe(DownloadedReleaseStatus.ENABLED);
	});

	it("returns IN_PROGRESS when some assets are in progress", () => {
		const assetStatus = [AssetStatus.IN_PROGRESS, AssetStatus.COMPLETED];
		const symbolicLinksData = [{ installedPath: null }, { installedPath: null }];

		const result = inferReleaseStatusFromAssets(assetStatus, symbolicLinksData);
		expect(result).toBe(DownloadedReleaseStatus.IN_PROGRESS);
	});

	it("returns IN_PROGRESS when some assets are PENDING and some are COMPLETED", () => {
		const assetStatus = [AssetStatus.PENDING, AssetStatus.COMPLETED];
		const symbolicLinksData = [{ installedPath: null }, { installedPath: null }];

		const result = inferReleaseStatusFromAssets(assetStatus, symbolicLinksData);
		expect(result).toBe(DownloadedReleaseStatus.IN_PROGRESS);
	});

	it("returns IN_PROGRESS when assets have mixed statuses without ERROR", () => {
		const assetStatus = [AssetStatus.PENDING, AssetStatus.IN_PROGRESS, AssetStatus.COMPLETED];
		const symbolicLinksData = [{ installedPath: null }];

		const result = inferReleaseStatusFromAssets(assetStatus, symbolicLinksData);
		expect(result).toBe(DownloadedReleaseStatus.IN_PROGRESS);
	});
});

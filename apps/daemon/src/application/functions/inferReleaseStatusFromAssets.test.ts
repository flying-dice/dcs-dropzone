import { describe, expect, it } from "bun:test";
import { AssetStatus } from "../enums/AssetStatus.ts";
import { DownloadedReleaseStatus } from "../enums/DownloadedReleaseStatus.ts";
import { inferReleaseStatusFromAssets } from "./inferReleaseStatusFromAssets.ts";

describe("inferReleaseStatusFromAssets", () => {
	it("returns PENDING when all assets are PENDING", () => {
		const assetStatus = [AssetStatus.PENDING, AssetStatus.PENDING];

		const result = inferReleaseStatusFromAssets(assetStatus, false);
		expect(result).toBe(DownloadedReleaseStatus.PENDING);
	});

	it("returns PENDING when all assets are PENDING even with enabled true", () => {
		const assetStatus = [AssetStatus.PENDING, AssetStatus.PENDING];

		const result = inferReleaseStatusFromAssets(assetStatus, true);
		expect(result).toBe(DownloadedReleaseStatus.PENDING);
	});

	it("returns ERROR when any asset has ERROR status", () => {
		const assetStatus = [AssetStatus.COMPLETED, AssetStatus.ERROR];

		const result = inferReleaseStatusFromAssets(assetStatus, true);
		expect(result).toBe(DownloadedReleaseStatus.ERROR);
	});

	it("returns ERROR when the first asset has ERROR status", () => {
		const assetStatus = [AssetStatus.ERROR, AssetStatus.COMPLETED];

		const result = inferReleaseStatusFromAssets(assetStatus, false);
		expect(result).toBe(DownloadedReleaseStatus.ERROR);
	});

	it("returns ENABLED when all assets are COMPLETED and enabled is true", () => {
		const assetStatus = [AssetStatus.COMPLETED, AssetStatus.COMPLETED];

		const result = inferReleaseStatusFromAssets(assetStatus, true);
		expect(result).toBe(DownloadedReleaseStatus.ENABLED);
	});

	it("returns DISABLED when all assets are COMPLETED and enabled is false", () => {
		const assetStatus = [AssetStatus.COMPLETED, AssetStatus.COMPLETED];

		const result = inferReleaseStatusFromAssets(assetStatus, false);
		expect(result).toBe(DownloadedReleaseStatus.DISABLED);
	});

	it("returns DISABLED when there are no assets and enabled is false", () => {
		const assetStatus: AssetStatus[] = [];

		const result = inferReleaseStatusFromAssets(assetStatus, false);
		expect(result).toBe(DownloadedReleaseStatus.DISABLED);
	});

	it("returns ENABLED when there are no assets and enabled is true", () => {
		const assetStatus: AssetStatus[] = [];

		const result = inferReleaseStatusFromAssets(assetStatus, true);
		expect(result).toBe(DownloadedReleaseStatus.ENABLED);
	});

	it("returns IN_PROGRESS when some assets are in progress", () => {
		const assetStatus = [AssetStatus.IN_PROGRESS, AssetStatus.COMPLETED];

		const result = inferReleaseStatusFromAssets(assetStatus, false);
		expect(result).toBe(DownloadedReleaseStatus.IN_PROGRESS);
	});

	it("returns IN_PROGRESS when some assets are PENDING and some are COMPLETED", () => {
		const assetStatus = [AssetStatus.PENDING, AssetStatus.COMPLETED];

		const result = inferReleaseStatusFromAssets(assetStatus, false);
		expect(result).toBe(DownloadedReleaseStatus.IN_PROGRESS);
	});

	it("returns IN_PROGRESS when assets have mixed statuses without ERROR", () => {
		const assetStatus = [AssetStatus.PENDING, AssetStatus.IN_PROGRESS, AssetStatus.COMPLETED];

		const result = inferReleaseStatusFromAssets(assetStatus, false);
		expect(result).toBe(DownloadedReleaseStatus.IN_PROGRESS);
	});

	it("returns INCONSISTENT when all assets are COMPLETED, enabled is true, but symlink integrity is invalid", () => {
		const assetStatus = [AssetStatus.COMPLETED, AssetStatus.COMPLETED];

		const result = inferReleaseStatusFromAssets(assetStatus, true, false);
		expect(result).toBe(DownloadedReleaseStatus.INCONSISTENT);
	});

	it("returns DISABLED when all assets are COMPLETED, enabled is false, even with invalid symlink integrity", () => {
		const assetStatus = [AssetStatus.COMPLETED, AssetStatus.COMPLETED];

		const result = inferReleaseStatusFromAssets(assetStatus, false, false);
		expect(result).toBe(DownloadedReleaseStatus.DISABLED);
	});

	it("returns ENABLED when all assets are COMPLETED, enabled is true, and symlink integrity is valid", () => {
		const assetStatus = [AssetStatus.COMPLETED, AssetStatus.COMPLETED];

		const result = inferReleaseStatusFromAssets(assetStatus, true, true);
		expect(result).toBe(DownloadedReleaseStatus.ENABLED);
	});

	it("returns ENABLED when no symlink integrity param provided (backward compat default true)", () => {
		const assetStatus = [AssetStatus.COMPLETED, AssetStatus.COMPLETED];

		const result = inferReleaseStatusFromAssets(assetStatus, true);
		expect(result).toBe(DownloadedReleaseStatus.ENABLED);
	});
});

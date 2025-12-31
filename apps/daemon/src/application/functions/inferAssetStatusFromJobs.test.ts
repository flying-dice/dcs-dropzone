import { describe, expect, it } from "bun:test";
import { AssetStatus } from "../enums/AssetStatus.ts";
import { DownloadJobStatus } from "../enums/DownloadJobStatus.ts";
import { ExtractJobStatus } from "../enums/ExtractJobStatus.ts";
import { inferAssetStatusFromJobs } from "./inferAssetStatusFromJobs.ts";

describe("inferAssetStatusFromJobs", () => {
	it("returns ERROR when any download job has ERROR status", () => {
		const downloadJobs = [{ status: DownloadJobStatus.COMPLETED }, { status: DownloadJobStatus.ERROR }];
		const extractJobs = [{ status: ExtractJobStatus.PENDING }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.ERROR);
	});

	it("returns ERROR when any extract job has ERROR status", () => {
		const downloadJobs = [{ status: DownloadJobStatus.COMPLETED }];
		const extractJobs = [{ status: ExtractJobStatus.COMPLETED }, { status: ExtractJobStatus.ERROR }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.ERROR);
	});

	it("returns ERROR when both download and extract jobs have ERROR status", () => {
		const downloadJobs = [{ status: DownloadJobStatus.ERROR }];
		const extractJobs = [{ status: ExtractJobStatus.ERROR }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.ERROR);
	});

	it("returns PENDING when all download and extract jobs are PENDING", () => {
		const downloadJobs = [{ status: DownloadJobStatus.PENDING }, { status: DownloadJobStatus.PENDING }];
		const extractJobs = [{ status: ExtractJobStatus.PENDING }, { status: ExtractJobStatus.PENDING }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.PENDING);
	});

	it("returns PENDING when jobs arrays are empty", () => {
		const downloadJobs: { status: DownloadJobStatus }[] = [];
		const extractJobs: { status: ExtractJobStatus }[] = [];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.PENDING);
	});

	it("returns COMPLETED when all download and extract jobs are COMPLETED", () => {
		const downloadJobs = [{ status: DownloadJobStatus.COMPLETED }, { status: DownloadJobStatus.COMPLETED }];
		const extractJobs = [{ status: ExtractJobStatus.COMPLETED }, { status: ExtractJobStatus.COMPLETED }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.COMPLETED);
	});

	it("returns IN_PROGRESS when some download jobs are completed but not all", () => {
		const downloadJobs = [{ status: DownloadJobStatus.COMPLETED }, { status: DownloadJobStatus.PENDING }];
		const extractJobs = [{ status: ExtractJobStatus.PENDING }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.IN_PROGRESS);
	});

	it("returns IN_PROGRESS when download jobs are completed but extract jobs are in progress", () => {
		const downloadJobs = [{ status: DownloadJobStatus.COMPLETED }];
		const extractJobs = [{ status: ExtractJobStatus.IN_PROGRESS }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.IN_PROGRESS);
	});

	it("returns IN_PROGRESS when some jobs are IN_PROGRESS", () => {
		const downloadJobs = [{ status: DownloadJobStatus.IN_PROGRESS }];
		const extractJobs = [{ status: ExtractJobStatus.PENDING }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.IN_PROGRESS);
	});

	it("returns IN_PROGRESS when download is complete but extract is pending", () => {
		const downloadJobs = [{ status: DownloadJobStatus.COMPLETED }, { status: DownloadJobStatus.COMPLETED }];
		const extractJobs = [{ status: ExtractJobStatus.PENDING }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.IN_PROGRESS);
	});
});

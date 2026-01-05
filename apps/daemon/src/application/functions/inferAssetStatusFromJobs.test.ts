import { describe, expect, it } from "bun:test";
import { JobState } from "@packages/queue";
import { AssetStatus } from "../enums/AssetStatus.ts";
import { inferAssetStatusFromJobs } from "./inferAssetStatusFromJobs.ts";

describe("inferAssetStatusFromJobs", () => {
	it("returns ERROR when any download job has ERROR status", () => {
		const downloadJobs = [{ state: JobState.Success }, { state: JobState.Failed }];
		const extractJobs = [{ state: JobState.Pending }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.ERROR);
	});

	it("returns ERROR when any extract job has ERROR status", () => {
		const downloadJobs = [{ state: JobState.Success }];
		const extractJobs = [{ state: JobState.Success }, { state: JobState.Failed }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.ERROR);
	});

	it("returns ERROR when both download and extract jobs have ERROR status", () => {
		const downloadJobs = [{ state: JobState.Failed }];
		const extractJobs = [{ state: JobState.Failed }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.ERROR);
	});

	it("returns PENDING when all download and extract jobs are PENDING", () => {
		const downloadJobs = [{ state: JobState.Pending }, { state: JobState.Pending }];
		const extractJobs = [{ state: JobState.Pending }, { state: JobState.Pending }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.PENDING);
	});

	it("returns PENDING when jobs arrays are empty", () => {
		const downloadJobs: { state: JobState }[] = [];
		const extractJobs: { state: JobState }[] = [];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.PENDING);
	});

	it("returns COMPLETED when all download and extract jobs are COMPLETED", () => {
		const downloadJobs = [{ state: JobState.Success }, { state: JobState.Success }];
		const extractJobs = [{ state: JobState.Success }, { state: JobState.Success }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.COMPLETED);
	});

	it("returns IN_PROGRESS when some download jobs are completed but not all", () => {
		const downloadJobs = [{ state: JobState.Success }, { state: JobState.Pending }];
		const extractJobs = [{ state: JobState.Pending }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.IN_PROGRESS);
	});

	it("returns IN_PROGRESS when download jobs are completed but extract jobs are in progress", () => {
		const downloadJobs = [{ state: JobState.Success }];
		const extractJobs = [{ state: JobState.Running }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.IN_PROGRESS);
	});

	it("returns IN_PROGRESS when some jobs are IN_PROGRESS", () => {
		const downloadJobs = [{ state: JobState.Running }];
		const extractJobs = [{ state: JobState.Pending }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.IN_PROGRESS);
	});

	it("returns IN_PROGRESS when download is complete but extract is pending", () => {
		const downloadJobs = [{ state: JobState.Success }, { state: JobState.Success }];
		const extractJobs = [{ state: JobState.Pending }];

		const result = inferAssetStatusFromJobs(downloadJobs, extractJobs);
		expect(result).toBe(AssetStatus.IN_PROGRESS);
	});
});

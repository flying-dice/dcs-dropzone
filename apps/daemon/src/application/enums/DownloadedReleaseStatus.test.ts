import { describe, expect, it } from "bun:test";
import { DownloadedReleaseStatus } from "./DownloadedReleaseStatus.ts";

describe("DownloadedReleaseStatus", () => {
	it("should have PENDING status", () => {
		expect(DownloadedReleaseStatus.PENDING).toBe(DownloadedReleaseStatus.PENDING);
	});

	it("should have IN_PROGRESS status", () => {
		expect(DownloadedReleaseStatus.IN_PROGRESS).toBe(DownloadedReleaseStatus.IN_PROGRESS);
	});

	it("should have DISABLED status", () => {
		expect(DownloadedReleaseStatus.DISABLED).toBe(DownloadedReleaseStatus.DISABLED);
	});

	it("should have ENABLED status", () => {
		expect(DownloadedReleaseStatus.ENABLED).toBe(DownloadedReleaseStatus.ENABLED);
	});

	it("should have ERROR status", () => {
		expect(DownloadedReleaseStatus.ERROR).toBe(DownloadedReleaseStatus.ERROR);
	});

	it("should have exactly 5 values", () => {
		const values = Object.values(DownloadedReleaseStatus);
		expect(values).toHaveLength(5);
	});
});

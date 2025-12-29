import { describe, expect, it } from "bun:test";
import { DownloadedReleaseStatus } from "./DownloadedReleaseStatus.ts";

describe("DownloadedReleaseStatus", () => {
	it("should have PENDING status", () => {
		expect(DownloadedReleaseStatus.PENDING).toBe("PENDING");
	});

	it("should have IN_PROGRESS status", () => {
		expect(DownloadedReleaseStatus.IN_PROGRESS).toBe("IN_PROGRESS");
	});

	it("should have DISABLED status", () => {
		expect(DownloadedReleaseStatus.DISABLED).toBe("DISABLED");
	});

	it("should have ENABLED status", () => {
		expect(DownloadedReleaseStatus.ENABLED).toBe("ENABLED");
	});

	it("should have ERROR status", () => {
		expect(DownloadedReleaseStatus.ERROR).toBe("ERROR");
	});

	it("should have exactly 5 values", () => {
		const values = Object.values(DownloadedReleaseStatus);
		expect(values).toHaveLength(5);
	});
});

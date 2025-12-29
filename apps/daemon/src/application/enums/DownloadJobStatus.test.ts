import { describe, expect, it } from "bun:test";
import { DownloadJobStatus } from "./DownloadJobStatus.ts";

describe("DownloadJobStatus", () => {
	it("should have PENDING status", () => {
		expect(DownloadJobStatus.PENDING).toBe(DownloadJobStatus.PENDING);
	});

	it("should have IN_PROGRESS status", () => {
		expect(DownloadJobStatus.IN_PROGRESS).toBe(DownloadJobStatus.IN_PROGRESS);
	});

	it("should have COMPLETED status", () => {
		expect(DownloadJobStatus.COMPLETED).toBe(DownloadJobStatus.COMPLETED);
	});

	it("should have ERROR status", () => {
		expect(DownloadJobStatus.ERROR).toBe(DownloadJobStatus.ERROR);
	});

	it("should have exactly 4 values", () => {
		const values = Object.values(DownloadJobStatus);
		expect(values).toHaveLength(4);
	});
});

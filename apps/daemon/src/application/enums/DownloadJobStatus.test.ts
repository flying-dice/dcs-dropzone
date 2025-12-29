import { describe, expect, it } from "bun:test";
import { DownloadJobStatus } from "./DownloadJobStatus.ts";

describe("DownloadJobStatus", () => {
	it("should have PENDING status", () => {
		expect(DownloadJobStatus.PENDING).toBe("PENDING");
	});

	it("should have IN_PROGRESS status", () => {
		expect(DownloadJobStatus.IN_PROGRESS).toBe("IN_PROGRESS");
	});

	it("should have COMPLETED status", () => {
		expect(DownloadJobStatus.COMPLETED).toBe("COMPLETED");
	});

	it("should have ERROR status", () => {
		expect(DownloadJobStatus.ERROR).toBe("ERROR");
	});

	it("should have exactly 4 values", () => {
		const values = Object.values(DownloadJobStatus);
		expect(values).toHaveLength(4);
	});
});

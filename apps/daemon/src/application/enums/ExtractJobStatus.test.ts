import { describe, expect, it } from "bun:test";
import { ExtractJobStatus } from "./ExtractJobStatus.ts";

describe("ExtractJobStatus", () => {
	it("should have PENDING status", () => {
		expect(ExtractJobStatus.PENDING).toBe("PENDING");
	});

	it("should have IN_PROGRESS status", () => {
		expect(ExtractJobStatus.IN_PROGRESS).toBe("IN_PROGRESS");
	});

	it("should have COMPLETED status", () => {
		expect(ExtractJobStatus.COMPLETED).toBe("COMPLETED");
	});

	it("should have ERROR status", () => {
		expect(ExtractJobStatus.ERROR).toBe("ERROR");
	});

	it("should have exactly 4 values", () => {
		const values = Object.values(ExtractJobStatus);
		expect(values).toHaveLength(4);
	});
});

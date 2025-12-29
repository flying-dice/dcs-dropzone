import { describe, expect, it } from "bun:test";
import { AssetStatus } from "./AssetStatus.ts";

describe("AssetStatus", () => {
	it("should have PENDING status", () => {
		expect(AssetStatus.PENDING).toBe(AssetStatus.PENDING);
	});

	it("should have IN_PROGRESS status", () => {
		expect(AssetStatus.IN_PROGRESS).toBe(AssetStatus.IN_PROGRESS);
	});

	it("should have COMPLETED status", () => {
		expect(AssetStatus.COMPLETED).toBe(AssetStatus.COMPLETED);
	});

	it("should have ERROR status", () => {
		expect(AssetStatus.ERROR).toBe(AssetStatus.ERROR);
	});

	it("should have exactly 4 values", () => {
		const values = Object.values(AssetStatus);
		expect(values).toHaveLength(4);
	});
});

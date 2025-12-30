import { describe, expect, it } from "bun:test";
import { TestUUIDGenerator } from "./TestUUIDGenerator";

describe("TestUUIDGenerator", () => {
	it("always returns the same UUID", () => {
		const uuid1 = TestUUIDGenerator()();
		const uuid2 = TestUUIDGenerator()();

		expect(uuid1).toBe("00000000-0000-0000-0000-000000000000");
		expect(uuid2).toBe("00000000-0000-0000-0000-000000000000");
	});

	it("should be customisable", () => {
		const generateUUID = TestUUIDGenerator();
		generateUUID.mockReturnValue("custom-uuid-1234");

		const uuid = generateUUID();

		expect(uuid).toBe("custom-uuid-1234");
	});
});

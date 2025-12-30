import { beforeEach, describe, expect, it } from "bun:test";
import { TestReleaseToggle } from "./TestReleaseToggle.ts";

describe("TestReleaseToggle", () => {
	let releaseToggle: TestReleaseToggle;

	beforeEach(() => {
		releaseToggle = new TestReleaseToggle();
	});

	it("calls mockEnable with the correct releaseId", () => {
		const releaseId = "release-1";

		releaseToggle.enable(releaseId);

		expect(releaseToggle.mockEnable).toHaveBeenCalledWith(releaseId);
	});

	it("calls mockDisable with the correct releaseId", () => {
		const releaseId = "release-1";

		releaseToggle.disable(releaseId);

		expect(releaseToggle.mockDisable).toHaveBeenCalledWith(releaseId);
	});

	it("does not call mockDisable when only enable is called", () => {
		const releaseId = "release-1";

		releaseToggle.enable(releaseId);

		expect(releaseToggle.mockDisable).not.toHaveBeenCalled();
	});

	it("does not call mockEnable when only disable is called", () => {
		const releaseId = "release-1";

		releaseToggle.disable(releaseId);

		expect(releaseToggle.mockEnable).not.toHaveBeenCalled();
	});
});

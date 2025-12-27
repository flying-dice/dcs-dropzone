import { describe, expect, it } from "bun:test";
import resolveReleaseDir from "./ResolveReleaseDir.ts";

describe("ResolveReleaseDir", () => {
	it("returns correct path when valid releaseId and dropzoneModsFolder are provided", () => {
		const deps = { dropzoneModsFolder: "/mods" };
		const args = { releaseId: "release123" };

		const result = resolveReleaseDir(deps)(args);

		expect(result).toBe("\\mods\\release123");
	});

	it("handles empty releaseId gracefully", () => {
		const deps = { dropzoneModsFolder: "\\mods" };
		const args = { releaseId: "" };

		const result = resolveReleaseDir(deps)(args);

		expect(result).toBe("/mods/");
	});

	it("handles dropzoneModsFolder with trailing slash correctly", () => {
		const deps = { dropzoneModsFolder: "\\mods\\" };
		const args = { releaseId: "release123" };

		const result = resolveReleaseDir(deps)(args);

		expect(result).toBe("\\mods\\release123");
	});

	it("handles dropzoneModsFolder as an empty string", () => {
		const deps = { dropzoneModsFolder: "" };
		const args = { releaseId: "release123" };

		const result = resolveReleaseDir(deps)(args);

		expect(result).toBe("release123");
	});
});

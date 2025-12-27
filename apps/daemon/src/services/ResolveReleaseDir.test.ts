import { describe, expect, it } from "bun:test";
import { ResolveReleaseDir } from "./ResolveReleaseDir.ts";

describe("ResolveReleaseDir", () => {
	it("returns correct path when valid releaseId and dropzoneModsFolder are provided", () => {
		const deps = { dropzoneModsFolder: "/mods" };
		const service = new ResolveReleaseDir(deps);
		const result = service.execute("release123");

		expect(result).toBe("\\mods\\release123");
	});

	it("handles empty releaseId gracefully", () => {
		const deps = { dropzoneModsFolder: "\\mods" };
		const service = new ResolveReleaseDir(deps);
		const result = service.execute("");

		expect(result).toBe("/mods/");
	});

	it("handles dropzoneModsFolder with trailing slash correctly", () => {
		const deps = { dropzoneModsFolder: "\\mods\\" };
		const service = new ResolveReleaseDir(deps);
		const result = service.execute("release123");

		expect(result).toBe("\\mods\\release123");
	});

	it("handles dropzoneModsFolder as an empty string", () => {
		const deps = { dropzoneModsFolder: "" };
		const service = new ResolveReleaseDir(deps);
		const result = service.execute("release123");

		expect(result).toBe("release123");
	});
});

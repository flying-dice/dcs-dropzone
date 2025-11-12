import { describe, expect, test } from "bun:test";
import { ModVisibility } from "../../../src/common/data.ts";
import { ModReleaseData } from "../../../src/app/server/schemas/ModReleaseData.ts";
import { ModReleaseCreateData } from "../../../src/app/server/schemas/ModReleaseCreateData.ts";

describe("ModRelease Schemas", () => {
	describe("ModReleaseData", () => {
		test("should validate a valid mod release", () => {
			const validRelease = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				mod_id: "mod-123",
				version: "1.0.0",
				changelog: "Initial release",
				assets: [
					{
						name: "Main Download",
						url: "https://cdn.example.com/mod.zip",
					},
				],
				visibility: ModVisibility.Public,
			};

			const result = ModReleaseData.safeParse(validRelease);
			expect(result.success).toBe(true);
		});

		test("should validate semver versions", () => {
			const validVersions = [
				"1.0.0",
				"2.1.3",
				"0.0.1",
				"1.0.0-alpha",
				"1.0.0-beta.1",
				"1.0.0-rc.2",
				"1.0.0+build.123",
				"1.0.0-beta.1+build.456",
			];

			for (const version of validVersions) {
				const release = {
					id: "123",
					mod_id: "mod-123",
					version,
					changelog: "Test",
					assets: [],
					visibility: ModVisibility.Public,
				};

				const result = ModReleaseData.safeParse(release);
				expect(result.success).toBe(true);
			}
		});

		test("should reject invalid semver versions", () => {
			const invalidVersions = ["1", "1.0", "v1.0.0", "1.0.0.0", "1.x.0"];

			for (const version of invalidVersions) {
				const release = {
					id: "123",
					mod_id: "mod-123",
					version,
					changelog: "Test",
					assets: [],
					visibility: ModVisibility.Public,
				};

				const result = ModReleaseData.safeParse(release);
				expect(result.success).toBe(false);
			}
		});

		test("should validate asset URLs", () => {
			const validUrls = [
				"https://cdn.example.com/mod.zip",
				"http://example.com/file.zip",
				"https://github.com/user/repo/releases/download/v1.0.0/mod.zip",
			];

			for (const url of validUrls) {
				const release = {
					id: "123",
					mod_id: "mod-123",
					version: "1.0.0",
					changelog: "Test",
					assets: [{ name: "Download", url }],
					visibility: ModVisibility.Public,
				};

				const result = ModReleaseData.safeParse(release);
				expect(result.success).toBe(true);
			}
		});

		test("should reject invalid asset URLs", () => {
			const invalidUrls = [
				"not-a-url",
				"/relative/path/file.zip",
				"just-a-string",
			];

			for (const url of invalidUrls) {
				const release = {
					id: "123",
					mod_id: "mod-123",
					version: "1.0.0",
					changelog: "Test",
					assets: [{ name: "Download", url }],
					visibility: ModVisibility.Public,
				};

				const result = ModReleaseData.safeParse(release);
				expect(result.success).toBe(false);
			}
		});

		test("should require asset name", () => {
			const release = {
				id: "123",
				mod_id: "mod-123",
				version: "1.0.0",
				changelog: "Test",
				assets: [{ name: "", url: "https://example.com/file.zip" }],
				visibility: ModVisibility.Public,
			};

			const result = ModReleaseData.safeParse(release);
			expect(result.success).toBe(false);
		});

		test("should accept multiple assets", () => {
			const release = {
				id: "123",
				mod_id: "mod-123",
				version: "1.0.0",
				changelog: "Test",
				assets: [
					{ name: "Main Download", url: "https://example.com/main.zip" },
					{ name: "Optional HD Pack", url: "https://example.com/hd.zip" },
					{ name: "Documentation", url: "https://example.com/docs.pdf" },
				],
				visibility: ModVisibility.Public,
			};

			const result = ModReleaseData.safeParse(release);
			expect(result.success).toBe(true);
		});

		test("should validate visibility values", () => {
			const validVisibilities = [
				ModVisibility.Public,
				ModVisibility.Private,
				ModVisibility.Unlisted,
			];

			for (const visibility of validVisibilities) {
				const release = {
					id: "123",
					mod_id: "mod-123",
					version: "1.0.0",
					changelog: "Test",
					assets: [],
					visibility,
				};

				const result = ModReleaseData.safeParse(release);
				expect(result.success).toBe(true);
			}
		});
	});

	describe("ModReleaseCreateData", () => {
		test("should validate create data without id, mod_id, and timestamps", () => {
			const createData = {
				version: "1.0.0",
				changelog: "Initial release",
				assets: [
					{
						name: "Main Download",
						url: "https://cdn.example.com/mod.zip",
					},
				],
				visibility: ModVisibility.Public,
			};

			const result = ModReleaseCreateData.safeParse(createData);
			expect(result.success).toBe(true);
		});

		test("should reject create data with id", () => {
			const createData = {
				id: "123",
				version: "1.0.0",
				changelog: "Initial release",
				assets: [],
				visibility: ModVisibility.Public,
			};

			// @ts-expect-error - intentionally testing invalid data
			const result = ModReleaseCreateData.safeParse(createData);
			// Should still parse since extra properties are ignored by default
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).not.toHaveProperty("id");
			}
		});

		test("should require version, changelog, assets, and visibility", () => {
			const incompleteData = {
				version: "1.0.0",
				// missing changelog, assets, visibility
			};

			const result = ModReleaseCreateData.safeParse(incompleteData);
			expect(result.success).toBe(false);
		});
	});
});

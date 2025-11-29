import { Database } from "bun:sqlite";
import { describe, expect, it } from "bun:test";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { ddlExports } from "../../database/db-ddl.ts";
import { T_MOD_RELEASE_ASSETS, T_MOD_RELEASES } from "../../database/schema.ts";
import type { ReleaseAssetRepository } from "../ReleaseAssetRepository.ts";
import { DrizzleSqliteReleaseAssetRepository } from "./DrizzleSqliteReleaseAssetRepository.ts";

describe("DrizzleSqliteReleaseAssetRepository", () => {
	const sqlite = new Database(":memory:", { create: true, strict: true });
	for (const sql of Object.values(ddlExports)) {
		sqlite.run(sql);
	}
	const _db = drizzle(sqlite);
	const repo: ReleaseAssetRepository = new DrizzleSqliteReleaseAssetRepository(
		_db,
	);

	// Setup test data
	_db
		.insert(T_MOD_RELEASES)
		.values({
			releaseId: "test-release-1",
			modId: "test-mod",
			modName: "Test Mod",
			version: "1.0.0",
		})
		.run();

	_db
		.insert(T_MOD_RELEASE_ASSETS)
		.values([
			{
				id: "asset-1",
				releaseId: "test-release-1",
				name: "test.zip",
				isArchive: true,
				urls: ["https://example.com/test.zip"],
			},
			{
				id: "asset-2",
				releaseId: "test-release-1",
				name: "readme.txt",
				isArchive: false,
				urls: ["https://example.com/readme.txt"],
			},
		])
		.run();

	it("should get release by id", () => {
		const release = repo.getReleaseById("test-release-1");
		expect(release).toEqual({
			releaseId: "test-release-1",
			modId: "test-mod",
			modName: "Test Mod",
			version: "1.0.0",
		});
	});

	it("should return undefined for non-existent release", () => {
		const release = repo.getReleaseById("non-existent");
		expect(release).toBeUndefined();
	});

	it("should get all assets for a release", () => {
		const assets = repo.getAssetsForRelease("test-release-1");
		expect(assets).toHaveLength(2);
		expect(assets).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: "asset-1",
					releaseId: "test-release-1",
					name: "test.zip",
					isArchive: true,
					urls: ["https://example.com/test.zip"],
				}),
				expect.objectContaining({
					id: "asset-2",
					releaseId: "test-release-1",
					name: "readme.txt",
					isArchive: false,
					urls: ["https://example.com/readme.txt"],
				}),
			]),
		);
	});

	it("should return empty array for release with no assets", () => {
		// Insert a release with no assets
		_db
			.insert(T_MOD_RELEASES)
			.values({
				releaseId: "empty-release",
				modId: "empty-mod",
				modName: "Empty Mod",
				version: "0.0.1",
			})
			.run();

		const assets = repo.getAssetsForRelease("empty-release");
		expect(assets).toHaveLength(0);
	});

	it("should return empty array for non-existent release", () => {
		const assets = repo.getAssetsForRelease("non-existent");
		expect(assets).toHaveLength(0);
	});
});

import { Database } from "bun:sqlite";
import { describe, expect, it } from "bun:test";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
	MissionScriptRunOn,
	SymbolicLinkDestRoot,
} from "../../../common/data.ts";
import { ddlExports } from "../../database/db-ddl.ts";
import {
	T_MOD_RELEASE_ASSETS,
	T_MOD_RELEASE_MISSION_SCRIPTS,
	T_MOD_RELEASE_SYMBOLIC_LINKS,
	T_MOD_RELEASES,
} from "../../database/schema.ts";
import type { SubscriptionRepository } from "../SubscriptionRepository.ts";
import { DrizzleSqliteSubscriptionRepository } from "./DrizzleSqliteSubscriptionRepository.ts";

describe("DrizzleSqliteSubscriptionRepository", () => {
	const sqlite = new Database(":memory:", { create: true, strict: true });
	for (const sql of Object.values(ddlExports)) {
		sqlite.run(sql);
	}
	const _db = drizzle(sqlite);
	const repo: SubscriptionRepository = new DrizzleSqliteSubscriptionRepository(
		_db,
	);

	it("should save a release with related rows", () => {
		repo.saveRelease({
			modId: "my-test-mod",
			modName: "My Test Mod",
			releaseId: "my-test-mod-release-1",
			version: "1.0.0",
			dependencies: [],
			assets: [
				{
					name: "asset-1.zip",
					urls: ["https://example.com/a1.zip"],
					isArchive: true,
				},
			],
			symbolicLinks: [
				{
					name: "link-1",
					src: "/src/a",
					dest: "/dest/a",
					destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				},
			],
			missionScripts: [
				{
					name: "script-1",
					purpose: "test",
					path: "/scripts/s1.lua",
					root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
					runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
				},
			],
		});

		expect(_db.select().from(T_MOD_RELEASES).all()).toMatchInlineSnapshot(`
      [
        {
          "modId": "my-test-mod",
          "modName": "My Test Mod",
          "releaseId": "my-test-mod-release-1",
          "version": "1.0.0",
        },
      ]
    `);

		expect(
			_db
				.select()
				.from(T_MOD_RELEASE_ASSETS)
				.all()
				.map((r) => ({
					id: r.id,
					releaseId: r.releaseId,
					name: r.name,
					isArchive: r.isArchive,
					urls: r.urls,
				})),
		).toMatchInlineSnapshot(`
      [
        {
          "id": "my-test-mod-release-1:0",
          "isArchive": true,
          "name": "asset-1.zip",
          "releaseId": "my-test-mod-release-1",
          "urls": [
            "https://example.com/a1.zip",
          ],
        },
      ]
    `);

		expect(
			_db
				.select()
				.from(T_MOD_RELEASE_SYMBOLIC_LINKS)
				.all()
				.map((r) => ({
					id: r.id,
					releaseId: r.releaseId,
					name: r.name,
					src: r.src,
					dest: r.dest,
					destRoot: r.destRoot,
				})),
		).toMatchInlineSnapshot(`
      [
        {
          "dest": "/dest/a",
          "destRoot": "DCS_WORKING_DIR",
          "id": "my-test-mod-release-1:0",
          "name": "link-1",
          "releaseId": "my-test-mod-release-1",
          "src": "/src/a",
        },
      ]
    `);

		expect(
			_db
				.select()
				.from(T_MOD_RELEASE_MISSION_SCRIPTS)
				.all()
				.map((r) => ({
					id: r.id,
					releaseId: r.releaseId,
					name: r.name,
					purpose: r.purpose,
					path: r.path,
					root: r.root,
					runOn: r.runOn,
				})),
		).toMatchInlineSnapshot(`
      [
        {
          "id": "my-test-mod-release-1:0",
          "name": "script-1",
          "path": "/scripts/s1.lua",
          "purpose": "test",
          "releaseId": "my-test-mod-release-1",
          "root": "DCS_WORKING_DIR",
          "runOn": "MISSION_START_BEFORE_SANITIZE",
        },
      ]
    `);
	});

	it("getAll should return all releaseId/modId pairs", () => {
		repo.saveRelease({
			modId: "other-mod",
			modName: "Other Mod",
			releaseId: "other-release-1",
			version: "0.1.0",
			dependencies: [],
			assets: [],
			symbolicLinks: [],
			missionScripts: [],
		});

		const all = repo.getAll();
		expect(all).toEqual(
			expect.arrayContaining([
				{ releaseId: "my-test-mod-release-1", modId: "my-test-mod" },
				{ releaseId: "other-release-1", modId: "other-mod" },
			]),
		);
	});

	it("deleteByReleaseId should cascade remove rows for that release", () => {
		// delete the first release
		repo.deleteByReleaseId("my-test-mod-release-1");

		expect(
			_db
				.select()
				.from(T_MOD_RELEASES)
				.all()
				.map((r) => r.releaseId),
		).toEqual(["other-release-1"]);

		expect(
			_db
				.select()
				.from(T_MOD_RELEASE_ASSETS)
				.all()
				.filter((r) => r.releaseId === "my-test-mod-release-1").length,
		).toBe(0);

		expect(
			_db
				.select()
				.from(T_MOD_RELEASE_SYMBOLIC_LINKS)
				.all()
				.filter((r) => r.releaseId === "my-test-mod-release-1").length,
		).toBe(0);

		expect(
			_db
				.select()
				.from(T_MOD_RELEASE_MISSION_SCRIPTS)
				.all()
				.filter((r) => r.releaseId === "my-test-mod-release-1").length,
		).toBe(0);
	});
});

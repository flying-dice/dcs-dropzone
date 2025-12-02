import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { ModVisibility } from "../../../common/data.ts";
import { Mod } from "../entities/Mod.ts";
import createRelease from "./CreateRelease.ts";

describe("CreateRelease", () => {
	let mongod: MongoMemoryServer;

	beforeEach(async () => {
		mongod = await MongoMemoryServer.create();
		await mongoose.disconnect().catch(() => {});
		await mongoose.connect(mongod.getUri());
	});

	afterEach(async () => {
		await mongoose.disconnect().catch(() => {});
		await mongod.stop();
	});

	it("creates a release for an existing mod", async () => {
		await Mod.create({
			id: "mod-1",
			name: "M",
			category: "OTHER",
			description: "desc",
			content: "c",
			tags: [],
			dependencies: [],
			screenshots: [],
			thumbnail: "t",
			visibility: "PRIVATE",
			maintainers: ["u1"],
			downloadsCount: 0,
			ratingsCount: 0,
			averageRating: 0,
		});

		const result = await createRelease({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			modId: "mod-1",
			createData: { version: "1.0.0" },
		});

		expect(result.isOk()).toBe(true);
		const value = result._unsafeUnwrap();
		expect(value).toMatchObject({
			id: expect.any(String),
			mod_id: "mod-1",
			version: "1.0.0",
			changelog: "abc",
			assets: [],
			symbolicLinks: [],
			missionScripts: [],
			visibility: ModVisibility.PUBLIC,
		});
	});

	describe("CreateRelease (unhappy)", () => {
		let mongod: MongoMemoryServer;

		beforeEach(async () => {
			mongod = await MongoMemoryServer.create();
			await mongoose.disconnect().catch(() => {});
			await mongoose.connect(mongod.getUri());
		});

		afterEach(async () => {
			await mongoose.disconnect().catch(() => {});
			await mongod.stop();
		});

		it("returns ModNotFound if mod does not exist", async () => {
			const result = await createRelease({
				user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
				modId: "missing-mod",
				createData: { version: "1.0.0" },
			});

			expect(result.isErr()).toBe(true);
			expect(result._unsafeUnwrapErr()).toBe("ModNotFound");
		});
	});
});

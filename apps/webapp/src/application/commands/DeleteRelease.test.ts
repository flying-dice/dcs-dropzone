import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import objectHash from "object-hash";
import { Mod } from "../../mongo-db/entities/Mod.ts";
import { ModRelease } from "../../mongo-db/entities/ModRelease.ts";
import deleteRelease from "./DeleteRelease.ts";

describe("DeleteRelease", () => {
	let mongod: MongoMemoryServer;

	beforeEach(async () => {
		mongod = await MongoMemoryServer.create();
		await mongoose.disconnect();
		await mongoose.connect(mongod.getUri());
	});

	afterEach(async () => {
		await mongoose.disconnect();
		await mongod.stop();
	});

	it("deletes an existing release", async () => {
		await Mod.create({
			id: "m1",
			name: "M",
			category: "OTHER",
			description: "d",
			content: "c",
			tags: [],
			dependencies: [],
			screenshots: [],
			thumbnail: "t",
			visibility: "PRIVATE",
			maintainers: ["u1"],
			downloadsCount: 0,
		});
		await ModRelease.create({
			id: "r1",
			modId: "m1",
			version: "1.0.0",
			versionHash: objectHash(Date.now()),
			changelog: "c",
			assets: [],
			symbolicLinks: [],
			missionScripts: [],
			visibility: "PUBLIC",
		});

		const result = await deleteRelease({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			modId: "m1",
			releaseId: "r1",
		});
		expect(result.isOk()).toBe(true);
		const still = await ModRelease.findOne({ id: "r1" }).lean();
		expect(still).toBeNull();
	});

	it("returns ModNotFound when mod does not exist", async () => {
		const result = await deleteRelease({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			modId: "nope",
			releaseId: "r1",
		});
		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe("ModNotFound");
	});

	it("returns ReleaseNotFound when release does not exist", async () => {
		await Mod.create({
			id: "m1",
			name: "M",
			category: "OTHER",
			description: "d",
			content: "c",
			tags: [],
			dependencies: [],
			screenshots: [],
			thumbnail: "t",
			visibility: "PRIVATE",
			maintainers: ["u1"],
			downloadsCount: 0,
		});
		const result = await deleteRelease({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			modId: "m1",
			releaseId: "nope",
		});
		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe("ReleaseNotFound");
	});
});

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { Mod } from "../entities/Mod.ts";
import deleteMod from "./DeleteMod.ts";

describe("DeleteMod", () => {
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

	it("deletes an existing mod owned by user", async () => {
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
			ratingsCount: 0,
			averageRating: 0,
		});

		const result = await deleteMod({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			id: "m1",
		});
		expect(result.isOk()).toBe(true);
		const still = await Mod.findOne({ id: "m1" }).lean();
		expect(still).toBeNull();
	});

	it("returns ModNotFound when mod does not exist", async () => {
		const result = await deleteMod({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			id: "nope",
		});
		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe("ModNotFound");
	});

	it("returns ModNotFound when user is not a maintainer", async () => {
		await Mod.create({
			id: "m2",
			name: "M",
			category: "OTHER",
			description: "d",
			content: "c",
			tags: [],
			dependencies: [],
			screenshots: [],
			thumbnail: "t",
			visibility: "PRIVATE",
			maintainers: ["someone-else"],
			downloadsCount: 0,
			ratingsCount: 0,
			averageRating: 0,
		});

		const result = await deleteMod({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			id: "m2",
		});
		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe("ModNotFound");
	});
});

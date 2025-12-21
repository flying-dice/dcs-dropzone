import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { Mod } from "../entities/Mod.ts";
import updateMod from "./UpdateMod.ts";

describe("UpdateMod", () => {
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

	it("updates an existing mod", async () => {
		await Mod.create({
			id: "m1",
			name: "M",
			category: "OTHER",
			description: "old",
			content: "c",
			tags: [],
			dependencies: [],
			screenshots: [],
			thumbnail: "t",
			visibility: "PRIVATE",
			maintainers: ["u1"],
			downloadsCount: 0,
		});

		const result = await updateMod({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			modId: "m1",
			updateData: { description: "new" } as any,
		});
		expect(result.isOk()).toBe(true);

		const mod = await Mod.findOne({ id: "m1" }).lean();
		expect(mod?.description).toBe("new");
	});

	it("returns ModNotFound when mod does not exist", async () => {
		const result = await updateMod({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			modId: "missing",
			updateData: { description: "x" } as any,
		});
		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe("ModNotFound");
	});

	it("returns ModNotFound when user is not a maintainer", async () => {
		await Mod.create({
			id: "m2",
			name: "M",
			category: "OTHER",
			description: "old",
			content: "c",
			tags: [],
			dependencies: [],
			screenshots: [],
			thumbnail: "t",
			visibility: "PRIVATE",
			maintainers: ["someone-else"],
			downloadsCount: 0,
		});

		const result = await updateMod({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			modId: "m2",
			updateData: { description: "x" } as any,
		});
		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe("ModNotFound");
	});
});

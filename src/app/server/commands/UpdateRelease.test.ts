import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import updateRelease from "./UpdateRelease.ts";

describe("UpdateRelease", () => {
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

	it("updates an existing release", async () => {
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
			mod_id: "m1",
			version: "1.0.0",
			changelog: "old",
			assets: [],
			symbolicLinks: [],
			missionScripts: [],
			visibility: "PUBLIC",
		});

		const result = await updateRelease({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			updateData: {
				id: "r1",
				mod_id: "m1",
				version: "1.0.1",
				changelog: "new",
				assets: [],
				symbolicLinks: [],
				missionScripts: [],
				visibility: "PUBLIC" as any,
			},
		});

		expect(result.isOk()).toBe(true);
		const rel = await ModRelease.findOne({ id: "r1" }).lean();
		expect(rel?.version).toBe("1.0.1");
		expect(rel?.changelog).toBe("new");
	});

	it("returns ModNotFound when mod does not exist", async () => {
		const result = await updateRelease({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			updateData: {
				id: "r1",
				mod_id: "missing",
				version: "1.0.1",
				changelog: "c",
				assets: [],
				symbolicLinks: [],
				missionScripts: [],
				visibility: "PUBLIC" as any,
			},
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
		const result = await updateRelease({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			updateData: {
				id: "missing",
				mod_id: "m1",
				version: "1.0.1",
				changelog: "c",
				assets: [],
				symbolicLinks: [],
				missionScripts: [],
				visibility: "PUBLIC" as any,
			},
		});
		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe("ReleaseNotFound");
	});
});

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { Mod } from "../entities/Mod.ts";
import { ModRelease } from "../entities/ModRelease.ts";
import markReleaseAsLatest from "./MarkReleaseAsLatest.ts";

describe("MarkReleaseAsLatest", () => {
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

	it("marks a release as latest and unmarks others", async () => {
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

		// Create two releases
		await ModRelease.create({
			id: "r1",
			mod_id: "m1",
			version: "1.0.0",
			changelog: "First release",
			assets: [],
			symbolicLinks: [],
			missionScripts: [],
			visibility: "PUBLIC",
			isLatest: true,
		});

		await ModRelease.create({
			id: "r2",
			mod_id: "m1",
			version: "2.0.0",
			changelog: "Second release",
			assets: [],
			symbolicLinks: [],
			missionScripts: [],
			visibility: "PUBLIC",
			isLatest: false,
		});

		// Mark r2 as latest
		const result = await markReleaseAsLatest({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			modId: "m1",
			releaseId: "r2",
		});

		expect(result.isOk()).toBe(true);

		// Check that r2 is now marked as latest
		const r2 = await ModRelease.findOne({ id: "r2" }).lean();
		expect(r2?.isLatest).toBe(true);

		// Check that r1 is no longer marked as latest
		const r1 = await ModRelease.findOne({ id: "r1" }).lean();
		expect(r1?.isLatest).toBe(false);
	});

	it("returns ModNotFound when mod does not exist", async () => {
		const result = await markReleaseAsLatest({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			modId: "missing",
			releaseId: "r1",
		});
		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe("ModNotFound");
	});

	it("returns ModNotFound when user does not own the mod", async () => {
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
			maintainers: ["u2"],
			downloadsCount: 0,
		});

		const result = await markReleaseAsLatest({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			modId: "m1",
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

		const result = await markReleaseAsLatest({
			user: { id: "u1", username: "u", name: "U", avatarUrl: "", profileUrl: "" },
			modId: "m1",
			releaseId: "missing",
		});
		expect(result.isErr()).toBe(true);
		expect(result._unsafeUnwrapErr()).toBe("ReleaseNotFound");
	});
});

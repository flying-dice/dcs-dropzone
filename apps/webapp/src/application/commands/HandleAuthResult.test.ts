import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { User } from "../../mongo-db/entities/User.ts";
import handleAuthResult from "./HandleAuthResult.ts";

describe("HandleAuthResult", () => {
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

	it("upserts user and returns UserData", async () => {
		const authResult = {
			id: "u1",
			name: "U",
			username: "user",
			avatarUrl: "a",
			profileUrl: "p",
		} as any;

		const user = await handleAuthResult({ authResult });
		expect(user).toMatchObject({ id: "u1", username: "user" });

		const inDb = await User.findOne({ id: "u1" }).lean();
		expect(inDb?.id).toBe("u1");
	});
});

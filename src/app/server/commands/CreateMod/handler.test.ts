import { beforeEach, describe, expect, it } from "bun:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { ModCategory } from "../../../../common/data.ts";
import { handler } from "./handler.ts";

describe("CreateMod", () => {
	beforeEach(async () => {
		const mongod = await MongoMemoryServer.create();
		await mongoose.connect(mongod.getUri());
	});

	it("should create the new mod and save to the database", async () => {
		const result = await handler({
			user: {
				id: "123456789",
				name: "Test User",
				avatarUrl: "",
				profileUrl: "",
				username: "TestUser",
			},
			createData: {
				name: "My Test Mod",
				category: ModCategory.OTHER,
				description: "Test Description",
			},
		});

		expect(result).toMatchObject({
			id: expect.any(String),
			name: "My Test Mod",
			category: ModCategory.OTHER,
			description: "Test Description",
			thumbnail: "https://cdn-icons-png.flaticon.com/512/10446/10446694.png",
			screenshots: [],
			content: "Add your mod content here.",
			tags: [],
			dependencies: [],
			visibility: "PRIVATE",
			maintainers: ["123456789"],
			averageRating: 0,
			ratingsCount: 0,
			downloadsCount: 0,
		});
	});
});

import { expect, it } from "bun:test";
import { MongoUrl } from "./MongoUrl";

it("parses a valid MongoDB URI correctly", () => {
	const mongoUrl = new MongoUrl("mongodb://localhost:27017/testdb");
	expect(mongoUrl.uri).toBe("mongodb://localhost:27017/testdb");
	expect(mongoUrl.isMemoryDatabase()).toBe(false);
	expect(mongoUrl.port).toBe(27017);
	expect(mongoUrl.dbName).toBe("testdb");
});

it("throws an error for an invalid MongoDB URI", () => {
	expect(() => new MongoUrl("invalid-uri")).toThrow("Invalid MongoDB URI: invalid-uri");
});

it("identifies an in-memory database URI", () => {
	const mongoUrl = new MongoUrl("mongodb://memory/testdb");
	expect(mongoUrl.isMemoryDatabase()).toBe(true);
});

it("returns undefined for port if not specified in the URI", () => {
	const mongoUrl = new MongoUrl("mongodb://localhost/testdb");
	expect(mongoUrl.port).toBeUndefined();
});

it("returns undefined for dbName if not specified in the URI", () => {
	const mongoUrl = new MongoUrl("mongodb://localhost:27017");
	expect(mongoUrl.dbName).toBeUndefined();
});

it("converts the MongoUrl instance to an object correctly", () => {
	const mongoUrl = new MongoUrl("mongodb://localhost:27017/testdb");
	expect(mongoUrl.toObject()).toEqual({
		uri: "mongodb://localhost:27017/testdb",
		isMemoryDatabase: false,
		port: 27017,
		dbName: "testdb",
	});
});

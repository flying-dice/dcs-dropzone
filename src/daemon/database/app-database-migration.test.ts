import { expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { AppDatabaseMigration } from "./app-database-migration";

it("computes sha256 hash from name in constructor", () => {
	const name = "initial_migration";
	const sql = "CREATE TABLE test(id INT);";

	const migration = new AppDatabaseMigration(name, sql);

	const expectedHash = createHash("sha256").update(name).digest("hex");

	expect(migration.hash).toBe(expectedHash);
});

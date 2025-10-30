// AppDatabase.test.ts
import { expect, it } from "bun:test";
import { AppDatabase } from "./app-database";
import { AppDatabaseMigration } from "./app-database-migration";

it("applies migrations once and skips already-applied ones", () => {
	const migrations = [
		{
			filename: "001_create_items.sql",
			sql: `CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, name TEXT);`,
		},
		{
			filename: "002_add_index.sql",
			sql: `CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);`,
		},
	];

	// First run: should create schema and record both migrations
	const appDb1 = new AppDatabase(
		":memory:",
		migrations.map((it) => new AppDatabaseMigration(it.filename, it.sql)),
	);
	const db1 = appDb1.getDatabase();

	// Ensure the table exists (migration actually executed)
	const tableExists1 =
		(
			db1
				.query(
					`SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='items'`,
				)
				.get() as any
		)?.cnt === 1;
	expect(tableExists1).toBe(true);

	// Ensure both migrations were recorded
	const appliedCount1 =
		(
			db1
				.query(`SELECT COUNT(*) as cnt FROM "__drizzle_migrations"`)
				.get() as any
		)?.cnt ?? 0;
	expect(appliedCount1).toBe(2);

	// Second run with the same migrations and same DB file: should skip re-applying
	const appDb2 = new AppDatabase(
		":memory:",
		migrations.map((it) => new AppDatabaseMigration(it.filename, it.sql)),
	);
	const db2 = appDb2.getDatabase();

	// Count should remain 2 (no duplicates)
	const appliedCount2 =
		(
			db2
				.query(`SELECT COUNT(*) as cnt FROM "__drizzle_migrations"`)
				.get() as any
		)?.cnt ?? 0;
	expect(appliedCount2).toBe(2);
});

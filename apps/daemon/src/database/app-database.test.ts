import { expect, it } from "bun:test";
import { AppDatabase } from "./app-database";
import { ddlExports } from "./db-ddl.ts";

it("applies migrations once and skips already-applied ones", () => {
	const appDb = AppDatabase.withMigrations(":memory:", ddlExports);

	const rows = appDb.getDatabase().query("SELECT filename, hash FROM '__drizzle_migrations'").all();
	expect(rows).toHaveLength(2);
	expect(rows[0]).toMatchObject({ filename: "_0000_init_sql" });
	expect(rows[1]).toMatchObject({ filename: "_0002_init_sql" });
});

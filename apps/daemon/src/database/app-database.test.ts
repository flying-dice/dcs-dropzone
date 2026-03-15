import { expect, it } from "bun:test";
import { AppDatabase } from "./app-database";
import { ddlExports } from "./db-ddl.ts";

it("applies migrations once and skips already-applied ones", () => {
	const appDb = AppDatabase.withMigrations(":memory:", ddlExports);

	expect(appDb.getDatabase().query("SELECT filename, hash FROM '__drizzle_migrations'").all()).toMatchInlineSnapshot(`
	  [
	    {
	      "filename": "_0000_init_sql",
	      "hash": "4427d6751820d8e114e94fe6b59772b5e7326909d0a1c6e3e6b994246f0781fb",
	    },
	    {
	      "filename": "_0001_add_enabled_column_sql",
	      "hash": "967df4b17b90cd07dd8471944a0564962a4c59eb7c2b5172fe1d48ad63cae78c",
	    },
	  ]
	`);
});

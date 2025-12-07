import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./src/database/ddl",
	schema: "./src/database/schema.ts",
	dialect: "sqlite",
});

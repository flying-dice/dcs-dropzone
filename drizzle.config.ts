import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/daemon/database/ddl",
  schema: "./src/daemon/database/schema.ts",
  dialect: "sqlite",
});

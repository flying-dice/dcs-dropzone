import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const T_MODS = sqliteTable("mods", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	version: text("version").notNull(),
});

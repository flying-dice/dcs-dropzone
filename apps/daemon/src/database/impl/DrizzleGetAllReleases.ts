import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { GetAllReleases } from "../../repository/GetAllReleases.ts";
import { T_MOD_RELEASES } from "../schema.ts";

export class DrizzleGetAllReleases implements GetAllReleases {
	constructor(
		protected deps: {
			db: BunSQLiteDatabase;
		},
	) {}

	execute() {
		return this.deps.db.select().from(T_MOD_RELEASES).all();
	}
}

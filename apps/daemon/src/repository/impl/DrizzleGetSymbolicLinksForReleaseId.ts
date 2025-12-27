import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { T_MOD_RELEASE_SYMBOLIC_LINKS } from "../../database/schema.ts";
import type { GetSymbolicLinksForReleaseId } from "../GetSymbolicLinksForReleaseId.ts";

export class DrizzleGetSymbolicLinksForReleaseId implements GetSymbolicLinksForReleaseId {
	constructor(
		protected deps: {
			db: BunSQLiteDatabase;
		},
	) {}

	execute(releaseId: string) {
		return this.deps.db
			.select()
			.from(T_MOD_RELEASE_SYMBOLIC_LINKS)
			.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.releaseId, releaseId))
			.all();
	}
}

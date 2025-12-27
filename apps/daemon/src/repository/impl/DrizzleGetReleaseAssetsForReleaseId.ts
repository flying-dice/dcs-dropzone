import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { T_MOD_RELEASE_ASSETS } from "../../database/schema.ts";
import type { GetReleaseAssetsForReleaseId } from "../GetReleaseAssetsForReleaseId.ts";

export class DrizzleGetReleaseAssetsForReleaseId implements GetReleaseAssetsForReleaseId {
	constructor(
		protected deps: {
			db: BunSQLiteDatabase;
		},
	) {}

	execute(releaseId: string) {
		return this.deps.db.select().from(T_MOD_RELEASE_ASSETS).where(eq(T_MOD_RELEASE_ASSETS.releaseId, releaseId)).all();
	}
}

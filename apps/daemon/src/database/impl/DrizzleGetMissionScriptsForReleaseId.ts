import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { GetMissionScriptsForReleaseId } from "../../repository/GetMissionScriptsForReleaseId.ts";
import { T_MOD_RELEASE_MISSION_SCRIPTS } from "../schema.ts";

export class DrizzleGetMissionScriptsForReleaseId implements GetMissionScriptsForReleaseId {
	constructor(
		protected deps: {
			db: BunSQLiteDatabase;
		},
	) {}

	execute(releaseId: string) {
		return this.deps.db
			.select()
			.from(T_MOD_RELEASE_MISSION_SCRIPTS)
			.where(eq(T_MOD_RELEASE_MISSION_SCRIPTS.releaseId, releaseId))
			.all();
	}
}

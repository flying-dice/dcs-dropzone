import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { MissionScriptRunOn } from "webapp";
import type { GetMissionScriptsByRunOn } from "../../repository/GetMissionScriptsByRunOn.ts";
import { T_MOD_RELEASE_MISSION_SCRIPTS, T_MOD_RELEASES } from "../schema.ts";

export class DrizzleGetMissionScriptsByRunOn implements GetMissionScriptsByRunOn {
	constructor(
		protected deps: {
			db: BunSQLiteDatabase;
		},
	) {}

	execute(runOn: MissionScriptRunOn) {
		return this.deps.db
			.select({
				modName: T_MOD_RELEASES.modName,
				modVersion: T_MOD_RELEASES.version,
				path: T_MOD_RELEASE_MISSION_SCRIPTS.path,
				pathRoot: T_MOD_RELEASE_MISSION_SCRIPTS.root,
			})
			.from(T_MOD_RELEASE_MISSION_SCRIPTS)
			.innerJoin(T_MOD_RELEASES, eq(T_MOD_RELEASE_MISSION_SCRIPTS.releaseId, T_MOD_RELEASES.releaseId))
			.where(eq(T_MOD_RELEASE_MISSION_SCRIPTS.runOn, runOn))
			.all();
	}
}

import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { DeleteModAndReleaseForReleaseId } from "../../repository/DeleteModAndReleaseForReleaseId.ts";
import {
	T_MOD_RELEASE_ASSETS,
	T_MOD_RELEASE_MISSION_SCRIPTS,
	T_MOD_RELEASE_SYMBOLIC_LINKS,
	T_MOD_RELEASES,
} from "../schema.ts";

export class DrizzleDeleteModAndReleaseForReleaseId implements DeleteModAndReleaseForReleaseId {
	constructor(
		protected readonly deps: {
			db: BunSQLiteDatabase;
		},
	) {}

	execute(releaseId: string): void {
		this.deps.db.transaction(
			(trx) => {
				trx.delete(T_MOD_RELEASE_ASSETS).where(eq(T_MOD_RELEASE_ASSETS.releaseId, releaseId)).run();

				trx.delete(T_MOD_RELEASE_SYMBOLIC_LINKS).where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.releaseId, releaseId)).run();

				trx.delete(T_MOD_RELEASE_MISSION_SCRIPTS).where(eq(T_MOD_RELEASE_MISSION_SCRIPTS.releaseId, releaseId)).run();

				trx.delete(T_MOD_RELEASES).where(eq(T_MOD_RELEASES.releaseId, releaseId)).run();
			},
			{ behavior: "immediate" },
		);
	}
}

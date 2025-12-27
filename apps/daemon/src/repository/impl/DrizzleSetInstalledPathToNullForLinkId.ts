import {eq} from "drizzle-orm";
import type {BunSQLiteDatabase} from "drizzle-orm/bun-sqlite";
import {T_MOD_RELEASE_SYMBOLIC_LINKS} from "../../database/schema.ts";
import type {SetInstalledPathForLinkId} from "../SetInstalledPathForLinkId.ts";

export class DrizzleSetInstalledPathForLinkId implements SetInstalledPathForLinkId {
	constructor(
		protected deps: {
			db: BunSQLiteDatabase;
		},
	) {}

	execute(symbolicLinkId: string, installedPath: string | null) {
		return this.deps.db
			.update(T_MOD_RELEASE_SYMBOLIC_LINKS)
			.set({ installedPath })
			.where(eq(T_MOD_RELEASE_SYMBOLIC_LINKS.id, symbolicLinkId))
			.run();
	}
}

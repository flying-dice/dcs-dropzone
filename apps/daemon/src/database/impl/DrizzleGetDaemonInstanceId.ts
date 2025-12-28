import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { GetDaemonInstanceId } from "../../repository/GetDaemonInstanceId.ts";
import { T_APP_ATTRIBUTES } from "../schema.ts";

export class DrizzleGetDaemonInstanceId implements GetDaemonInstanceId {
	constructor(
		protected deps: {
			db: BunSQLiteDatabase;
			daemonInstanceIdKey: string;
		},
	) {}

	execute(): string | undefined {
		const res = this.deps.db
			.select()
			.from(T_APP_ATTRIBUTES)
			.where(eq(T_APP_ATTRIBUTES.key, this.deps.daemonInstanceIdKey))
			.get();

		if (res) {
			return res.value as string;
		}

		return undefined;
	}
}

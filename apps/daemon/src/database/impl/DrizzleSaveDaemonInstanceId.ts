import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { SaveDaemonInstanceId } from "../../repository/SaveDaemonInstanceId.ts";
import { T_APP_ATTRIBUTES } from "../schema.ts";

export class DrizzleSaveDaemonInstanceId implements SaveDaemonInstanceId {
	constructor(
		protected deps: {
			db: BunSQLiteDatabase;
			daemonInstanceIdKey: string;
		},
	) {}

	execute(instanceId: string): string {
		const res = this.deps.db
			.insert(T_APP_ATTRIBUTES)
			.values({
				key: this.deps.daemonInstanceIdKey,
				value: instanceId,
			})
			.returning()
			.get();

		return res.value as string;
	}
}

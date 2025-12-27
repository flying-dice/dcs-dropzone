import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { getLogger } from "log4js";
import { T_APP_ATTRIBUTES } from "../database/schema.ts";

const logger = getLogger("GetDaemonInstanceId");

const DAEMON_INSTANCE_ID_KEY = "daemon_instance_id";

export type GetDaemonInstanceIdQuery = {
	db: BunSQLiteDatabase;
};
export type GetDaemonInstanceIdResult = string;

export default function (query: GetDaemonInstanceIdQuery): GetDaemonInstanceIdResult {
	const { db } = query;
	let daemonInstanceId = db
		.select()
		.from(T_APP_ATTRIBUTES)
		.where(eq(T_APP_ATTRIBUTES.key, DAEMON_INSTANCE_ID_KEY))
		.get();

	if (!daemonInstanceId) {
		daemonInstanceId = db
			.insert(T_APP_ATTRIBUTES)
			.values({
				key: DAEMON_INSTANCE_ID_KEY,
				value: crypto.randomUUID(),
			})
			.returning()
			.get();
		logger.info(`Generated new daemon instance ID: ${daemonInstanceId.value}`);
	} else {
		logger.info(`Using existing daemon instance ID: ${daemonInstanceId.value}`);
	}

	return daemonInstanceId.value;
}

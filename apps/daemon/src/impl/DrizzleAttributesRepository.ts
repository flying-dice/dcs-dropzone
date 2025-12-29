import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { AttributesRepository } from "../application/repository/AttributesRepository.ts";
import { T_APP_ATTRIBUTES } from "../database/schema.ts";

export class DrizzleAttributesRepository implements AttributesRepository {
	protected static readonly DAEMON_INSTANCE_ID_KEY = "daemon_instance_id";

	protected readonly db: BunSQLiteDatabase;

	constructor(deps: {
		db: BunSQLiteDatabase;
	}) {
		this.db = deps.db;
	}

	getDaemonInstanceId(): string | undefined {
		const res = this.db
			.select()
			.from(T_APP_ATTRIBUTES)
			.where(eq(T_APP_ATTRIBUTES.key, DrizzleAttributesRepository.DAEMON_INSTANCE_ID_KEY))
			.get();

		if (res) {
			return res.value as string;
		}
	}

	saveDaemonInstanceId(instanceId: string): string {
		const res = this.db
			.insert(T_APP_ATTRIBUTES)
			.values({
				key: DrizzleAttributesRepository.DAEMON_INSTANCE_ID_KEY,
				value: instanceId,
			})
			.returning()
			.get();

		return res.value as string;
	}
}

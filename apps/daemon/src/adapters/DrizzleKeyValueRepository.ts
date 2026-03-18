import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { getLogger } from "log4js";
import type { KeyValueRepository } from "../application/ports/KeyValueRepository.ts";
import { T_KEY_VALUE } from "../database/schema.ts";

const _logger = getLogger("DrizzleKeyValueRepository");

export class DrizzleKeyValueRepository implements KeyValueRepository {
	protected readonly db: BunSQLiteDatabase;

	constructor(deps: {
		db: BunSQLiteDatabase;
	}) {
		this.db = deps.db;
	}

	get(key: string): string | undefined {
		const res = this.db.select().from(T_KEY_VALUE).where(eq(T_KEY_VALUE.key, key)).get();

		if (res) {
			return res.value as string;
		}
	}

	save(key: string, value: string): string {
		const res = this.db
			.insert(T_KEY_VALUE)
			.values({
				key,
				value,
			})
			.onConflictDoUpdate({
				target: T_KEY_VALUE.key,
				set: { value },
			})
			.returning()
			.get();

		return res.value as string;
	}
}

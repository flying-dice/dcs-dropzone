import { Log } from "@packages/decorators";
import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { getLogger } from "log4js";
import type { AttributesRepository } from "../application/ports/AttributesRepository.ts";
import { T_APP_ATTRIBUTES } from "../database/schema.ts";

const logger = getLogger("DrizzleAttributesRepository");

export class DrizzleAttributesRepository implements AttributesRepository {
	protected readonly db: BunSQLiteDatabase;

	constructor(deps: {
		db: BunSQLiteDatabase;
	}) {
		this.db = deps.db;
	}

	@Log(logger)
	get(key: string): string | undefined {
		const res = this.db.select().from(T_APP_ATTRIBUTES).where(eq(T_APP_ATTRIBUTES.key, key)).get();

		if (res) {
			return res.value as string;
		}
	}

	@Log(logger)
	save(key: string, value: string): string {
		const res = this.db
			.insert(T_APP_ATTRIBUTES)
			.values({
				key,
				value,
			})
			.returning()
			.get();

		return res.value as string;
	}
}

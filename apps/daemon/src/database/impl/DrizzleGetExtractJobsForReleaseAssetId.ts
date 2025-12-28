import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { GetExtractJobsForReleaseAssetId } from "../../repository/GetExtractJobsForReleaseAssetId.ts";
import { T_EXTRACT_QUEUE } from "../schema.ts";

export class DrizzleGetExtractJobsForReleaseAssetId implements GetExtractJobsForReleaseAssetId {
	constructor(
		protected deps: {
			db: BunSQLiteDatabase;
		},
	) {}

	execute(releaseAssetId: string) {
		return this.deps.db.select().from(T_EXTRACT_QUEUE).where(eq(T_EXTRACT_QUEUE.releaseAssetId, releaseAssetId)).all();
	}
}

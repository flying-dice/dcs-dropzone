import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { GetDownloadJobsForReleaseAssetId } from "../../repository/GetDownloadJobsForReleaseAssetId.ts";
import { T_DOWNLOAD_QUEUE } from "../schema.ts";

export class DrizzleGetDownloadJobsForReleaseAssetId implements GetDownloadJobsForReleaseAssetId {
	constructor(
		protected deps: {
			db: BunSQLiteDatabase;
		},
	) {}

	execute(releaseAssetId: string) {
		return this.deps.db
			.select()
			.from(T_DOWNLOAD_QUEUE)
			.where(eq(T_DOWNLOAD_QUEUE.releaseAssetId, releaseAssetId))
			.all();
	}
}

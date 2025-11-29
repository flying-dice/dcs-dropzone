import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { T_MOD_RELEASE_ASSETS, T_MOD_RELEASES } from "../../database/schema.ts";
import type {
	ReleaseAsset,
	ReleaseAssetRepository,
	ReleaseData,
} from "../ReleaseAssetRepository.ts";

export class DrizzleSqliteReleaseAssetRepository
	implements ReleaseAssetRepository
{
	constructor(private readonly db: BunSQLiteDatabase) {}

	getReleaseById(releaseId: string): ReleaseData | undefined {
		return this.db
			.select({
				releaseId: T_MOD_RELEASES.releaseId,
				modId: T_MOD_RELEASES.modId,
				modName: T_MOD_RELEASES.modName,
				version: T_MOD_RELEASES.version,
			})
			.from(T_MOD_RELEASES)
			.where(eq(T_MOD_RELEASES.releaseId, releaseId))
			.get();
	}

	getAssetsForRelease(releaseId: string): ReleaseAsset[] {
		return this.db
			.select()
			.from(T_MOD_RELEASE_ASSETS)
			.where(eq(T_MOD_RELEASE_ASSETS.releaseId, releaseId))
			.all();
	}
}

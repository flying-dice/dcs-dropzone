import type { ModCategory } from "../enums/ModCategory.ts";
import type { ModData } from "../schemas/ModData.ts";
import type { ModReleaseData } from "../schemas/ModReleaseData.ts";
import type { ModReleaseUpdateData } from "../schemas/ModReleaseUpdateData.ts";
import type { ModSummaryData } from "../schemas/ModSummaryData.ts";
import type { ModUpdateData } from "../schemas/ModUpdateData.ts";

export interface ModRepository {
	createMod(modData: ModData): Promise<ModData>;
	updateMod(updateData: ModUpdateData): Promise<ModData | undefined>;
	deleteMod(modId: string): Promise<ModData | undefined>;
	findModById(modId: string): Promise<ModData | undefined>;
	setModDownloadsCount(modId: string, downloadsCount: number): Promise<void>;

	createModRelease(releaseData: ModReleaseData): Promise<ModReleaseData>;
	updateModRelease(updateData: ModReleaseUpdateData): Promise<ModReleaseData | undefined>;
	deleteModRelease(modId: string, releaseId: string): Promise<ModReleaseData | undefined>;
	findModReleaseById(modId: string, releaseId: string): Promise<ModReleaseData | undefined>;
	findModReleasesByModId(modId: string): Promise<ModReleaseData[]>;
	setModReleaseDownloadsCount(releaseId: string, downloadsCount: number): Promise<void>;

	isMaintainerForMod(userId: string, modId: string): Promise<boolean | undefined>;

	findAllModsForMaintainerSortedByCreatedAtDesc(userId: string): Promise<ModSummaryData[]>;
	getTotalDownloadsCountForMaintainer(userId: string): Promise<number>;
	getTotalPublicModsCountForMaintainer(userId: string): Promise<number>;

	// Public mod queries
	findPublicModById(
		modId: string,
	): Promise<{ mod: ModData; maintainers: { id: string; username: string }[] } | undefined>;
	findAllPublishedMods(query: {
		page: number;
		size: number;
		filter?: {
			category?: ModCategory;
			maintainers?: string[];
			tags?: string[];
			term?: string;
		};
	}): Promise<{
		data: ModSummaryData[];
		count: number;
		categories: string[];
		tags: string[];
		maintainers: { id: string; username: string }[];
	}>;
	findAllFeaturedMods(): Promise<ModSummaryData[]>;
	findAllPopularMods(): Promise<ModSummaryData[]>;
	findAllTags(): Promise<string[]>;
	getCategoryCounts(): Promise<Record<string, number>>;
	getServerMetrics(): Promise<{ totalMods: number; totalDownloads: number }>;

	// Public release queries
	findPublicModRelease(modId: string, releaseId: string): Promise<ModReleaseData | undefined>;
	findPublicModReleases(modId: string): Promise<ModReleaseData[] | undefined>;
	findLatestPublicModRelease(modId: string): Promise<ModReleaseData | undefined>;
	findUpdateInformationByIds(
		modIds: string[],
	): Promise<{ modId: string; id: string; version: string; createdAt: string }[]>;
}

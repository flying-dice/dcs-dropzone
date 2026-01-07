import type { ModUpdateData } from "../../wui/_autogen/api.ts";
import type { ModData } from "../schemas/ModData.ts";
import type { ModReleaseData } from "../schemas/ModReleaseData.ts";
import type { ModReleaseUpdateData } from "../schemas/ModReleaseUpdateData.ts";
import type { ModSummaryData } from "../schemas/ModSummaryData.ts";

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
}

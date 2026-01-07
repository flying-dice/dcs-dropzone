import type { ModCategory } from "../application/enums/ModCategory.ts";
import { ModVisibility } from "../application/enums/ModVisibility.ts";
import type { ModFilters, ModRepository } from "../application/ports/ModRepository.ts";
import type { ModData } from "../application/schemas/ModData.ts";
import type { ModReleaseData } from "../application/schemas/ModReleaseData.ts";
import type { ModReleaseUpdateData } from "../application/schemas/ModReleaseUpdateData.ts";
import type { ModSummaryData } from "../application/schemas/ModSummaryData.ts";
import type { ModUpdateData } from "../application/schemas/ModUpdateData.ts";

/**
 * In-memory test double for ModRepository port.
 */
export class TestModRepository implements ModRepository {
	private mods = new Map<string, ModData>();
	private releases = new Map<string, ModReleaseData>();

	async createMod(modData: ModData): Promise<ModData> {
		this.mods.set(modData.id, modData);
		return modData;
	}

	async updateMod(updateData: ModUpdateData): Promise<ModData | undefined> {
		const existing = this.mods.get(updateData.id);
		if (!existing) {
			return undefined;
		}
		const updated = { ...existing, ...updateData };
		this.mods.set(updateData.id, updated);
		return updated;
	}

	async deleteMod(modId: string): Promise<ModData | undefined> {
		const existing = this.mods.get(modId);
		if (!existing) {
			return undefined;
		}
		this.mods.delete(modId);
		// Also delete associated releases
		for (const [releaseId, release] of this.releases.entries()) {
			if (release.modId === modId) {
				this.releases.delete(releaseId);
			}
		}
		return existing;
	}

	async findModById(modId: string): Promise<ModData | undefined> {
		return this.mods.get(modId);
	}

	async setModDownloadsCount(modId: string, downloadsCount: number): Promise<void> {
		const mod = this.mods.get(modId);
		if (mod) {
			mod.downloadsCount = downloadsCount;
		}
	}

	async createModRelease(releaseData: ModReleaseData): Promise<ModReleaseData> {
		this.releases.set(releaseData.id, releaseData);
		// Update mod's latestReleaseId
		const mod = this.mods.get(releaseData.modId);
		if (mod) {
			mod.latestReleaseId = releaseData.id;
		}
		return releaseData;
	}

	async updateModRelease(updateData: ModReleaseUpdateData): Promise<ModReleaseData | undefined> {
		const existing = this.releases.get(updateData.id);
		if (!existing || existing.modId !== updateData.modId) {
			return undefined;
		}
		const updated = { ...existing, ...updateData };
		this.releases.set(updateData.id, updated);
		return updated;
	}

	async deleteModRelease(modId: string, releaseId: string): Promise<ModReleaseData | undefined> {
		const existing = this.releases.get(releaseId);
		if (!existing || existing.modId !== modId) {
			return undefined;
		}
		this.releases.delete(releaseId);
		return existing;
	}

	async findModReleaseById(modId: string, releaseId: string): Promise<ModReleaseData | undefined> {
		const release = this.releases.get(releaseId);
		if (!release || release.modId !== modId) {
			return undefined;
		}
		return release;
	}

	async findModReleasesByModId(modId: string): Promise<ModReleaseData[]> {
		const releases: ModReleaseData[] = [];
		for (const release of this.releases.values()) {
			if (release.modId === modId) {
				releases.push(release);
			}
		}
		return releases.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
	}

	async setModReleaseDownloadsCount(releaseId: string, downloadsCount: number): Promise<void> {
		const release = this.releases.get(releaseId);
		if (release) {
			release.downloadsCount = downloadsCount;
		}
	}

	async isMaintainerForMod(userId: string, modId: string): Promise<boolean | undefined> {
		const mod = this.mods.get(modId);
		if (!mod) {
			return undefined;
		}
		return mod.maintainers.includes(userId);
	}

	async findAllModsForMaintainerSortedByCreatedAtDesc(userId: string): Promise<ModSummaryData[]> {
		const userMods: ModSummaryData[] = [];
		for (const mod of this.mods.values()) {
			if (mod.maintainers.includes(userId)) {
				userMods.push({
					id: mod.id,
					name: mod.name,
					category: mod.category,
					description: mod.description,
					thumbnail: mod.thumbnail,
					dependencies: mod.dependencies,
					maintainers: mod.maintainers,
					tags: mod.tags,
					downloadsCount: mod.downloadsCount,
				});
			}
		}
		return userMods;
	}

	async getTotalDownloadsCountForMaintainer(userId: string): Promise<number> {
		let total = 0;
		for (const mod of this.mods.values()) {
			if (mod.maintainers.includes(userId)) {
				total += mod.downloadsCount;
			}
		}
		return total;
	}

	async getTotalPublicModsCountForMaintainer(userId: string): Promise<number> {
		let count = 0;
		for (const mod of this.mods.values()) {
			if (mod.maintainers.includes(userId) && mod.visibility === ModVisibility.PUBLIC) {
				count++;
			}
		}
		return count;
	}

	// Public mod queries
	async findPublicModById(modId: string): Promise<ModData | undefined> {
		const mod = this.mods.get(modId);
		if (!mod || (mod.visibility !== ModVisibility.PUBLIC && mod.visibility !== ModVisibility.UNLISTED)) {
			return undefined;
		}

		return mod;
	}

	async findAllPublishedMods(query: { page: number; size: number; filter?: ModFilters }): Promise<{
		data: ModSummaryData[];
		count: number;
		categories: ModCategory[];
		tags: string[];
		maintainers: string[];
	}> {
		let mods = Array.from(this.mods.values()).filter((mod) => mod.visibility === ModVisibility.PUBLIC);

		if (query.filter?.category) {
			mods = mods.filter((mod) => mod.category === query.filter!.category);
		}

		if (query.filter?.maintainers && query.filter.maintainers.length > 0) {
			mods = mods.filter((mod) => mod.maintainers.some((m) => query.filter!.maintainers!.includes(m)));
		}

		if (query.filter?.tags && query.filter.tags.length > 0) {
			mods = mods.filter((mod) => query.filter!.tags!.every((t) => mod.tags.includes(t)));
		}

		if (query.filter?.term) {
			const term = query.filter.term.toLowerCase();
			mods = mods.filter((mod) => mod.name.toLowerCase().includes(term));
		}

		const count = mods.length;
		const start = (query.page - 1) * query.size;
		const paginatedMods = mods.slice(start, start + query.size);

		const categories = [...new Set(mods.map((mod) => mod.category))];
		const allTags = [...new Set(mods.flatMap((mod) => mod.tags))];
		const maintainers = [...new Set(mods.flatMap((mod) => mod.maintainers))];

		return {
			data: paginatedMods.map((mod) => ({
				id: mod.id,
				name: mod.name,
				category: mod.category,
				description: mod.description,
				thumbnail: mod.thumbnail,
				dependencies: mod.dependencies,
				maintainers: mod.maintainers,
				tags: mod.tags,
				downloadsCount: mod.downloadsCount,
			})),
			count,
			categories,
			tags: allTags,
			maintainers,
		};
	}

	async findAllFeaturedMods(): Promise<ModSummaryData[]> {
		// For test purposes, return first 4 public mods
		const publicMods = Array.from(this.mods.values()).filter((mod) => mod.visibility === ModVisibility.PUBLIC);
		return publicMods.slice(0, 4).map((mod) => ({
			id: mod.id,
			name: mod.name,
			category: mod.category,
			description: mod.description,
			thumbnail: mod.thumbnail,
			dependencies: mod.dependencies,
			maintainers: mod.maintainers,
			tags: mod.tags,
			downloadsCount: mod.downloadsCount,
		}));
	}

	async findAllPopularMods(): Promise<ModSummaryData[]> {
		const publicMods = Array.from(this.mods.values())
			.filter((mod) => mod.visibility === ModVisibility.PUBLIC)
			.sort((a, b) => b.downloadsCount - a.downloadsCount);
		return publicMods.slice(0, 10).map((mod) => ({
			id: mod.id,
			name: mod.name,
			category: mod.category,
			description: mod.description,
			thumbnail: mod.thumbnail,
			dependencies: mod.dependencies,
			maintainers: mod.maintainers,
			tags: mod.tags,
			downloadsCount: mod.downloadsCount,
		}));
	}

	async findAllTags(): Promise<string[]> {
		const publicMods = Array.from(this.mods.values()).filter((mod) => mod.visibility === ModVisibility.PUBLIC);
		const tags = new Set<string>();
		for (const mod of publicMods) {
			for (const tag of mod.tags) {
				tags.add(tag);
			}
		}
		return [...tags].sort();
	}

	async getCategoryCounts(): Promise<Record<string, number>> {
		const counts: Record<string, number> = {};
		for (const mod of this.mods.values()) {
			if (mod.visibility === ModVisibility.PUBLIC) {
				counts[mod.category] = (counts[mod.category] ?? 0) + 1;
			}
		}
		return counts;
	}

	async getServerMetrics(): Promise<{ totalMods: number; totalDownloads: number }> {
		let totalMods = 0;
		let totalDownloads = 0;
		for (const mod of this.mods.values()) {
			if (mod.visibility === ModVisibility.PUBLIC) {
				totalMods++;
				totalDownloads += mod.downloadsCount;
			}
		}
		return { totalMods, totalDownloads };
	}

	// Public release queries
	async findPublicModRelease(modId: string, releaseId: string): Promise<ModReleaseData | undefined> {
		const mod = this.mods.get(modId);
		if (!mod || (mod.visibility !== ModVisibility.PUBLIC && mod.visibility !== ModVisibility.UNLISTED)) {
			return undefined;
		}

		const release = this.releases.get(releaseId);
		if (
			!release ||
			release.modId !== modId ||
			(release.visibility !== ModVisibility.PUBLIC && release.visibility !== ModVisibility.UNLISTED)
		) {
			return undefined;
		}

		return release;
	}

	async findPublicModReleases(modId: string): Promise<ModReleaseData[] | undefined> {
		const mod = this.mods.get(modId);
		if (!mod || (mod.visibility !== ModVisibility.PUBLIC && mod.visibility !== ModVisibility.UNLISTED)) {
			return undefined;
		}

		const releases: ModReleaseData[] = [];
		for (const release of this.releases.values()) {
			if (release.modId === modId && release.visibility === ModVisibility.PUBLIC) {
				releases.push(release);
			}
		}
		return releases.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
	}

	async findLatestPublicModRelease(modId: string): Promise<ModReleaseData | undefined> {
		const mod = this.mods.get(modId);
		if (
			!mod ||
			(mod.visibility !== ModVisibility.PUBLIC && mod.visibility !== ModVisibility.UNLISTED) ||
			!mod.latestReleaseId
		) {
			return undefined;
		}

		const release = this.releases.get(mod.latestReleaseId);
		if (!release || (release.visibility !== ModVisibility.PUBLIC && release.visibility !== ModVisibility.UNLISTED)) {
			return undefined;
		}

		return release;
	}

	async findUpdateInformationByIds(
		modIds: string[],
	): Promise<{ modId: string; id: string; version: string; createdAt: string }[]> {
		const results: { modId: string; id: string; version: string; createdAt: string }[] = [];

		for (const modId of modIds) {
			const modReleases = Array.from(this.releases.values())
				.filter((r) => r.modId === modId && r.visibility === ModVisibility.PUBLIC)
				.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

			const latest = modReleases[0];
			if (latest) {
				results.push({
					modId,
					id: latest.id,
					version: latest.version,
					createdAt: latest.createdAt ?? new Date().toISOString(),
				});
			}
		}

		return results;
	}
}

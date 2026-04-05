import { getLogger } from "log4js";
import type { ModCategory } from "../enums/ModCategory.ts";
import { ModCategory as ModCategoryValues } from "../enums/ModCategory.ts";
import { ModNotFoundError, NotFoundError, ReleaseNotFoundError } from "../errors.ts";
import type { ModRepository } from "../ports/ModRepository.ts";
import type { UserRepository } from "../ports/UserRepository.ts";
import { ModAvailableFilterData } from "../schemas/ModAvailableFilterData.ts";
import type { ModData } from "../schemas/ModData.ts";
import type { ModReleaseData } from "../schemas/ModReleaseData.ts";
import { ModSummaryData } from "../schemas/ModSummaryData.ts";
import { PageData } from "../schemas/PageData.ts";
import { ServerMetricsData } from "../schemas/ServerMetricsData.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("PublicMods");

type Deps = {
	modRepository: ModRepository;
	userRepository: UserRepository;
};

export class PublicMods {
	constructor(private readonly deps: Deps) {}

	async getAllPublishedMods(query: {
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
		page: PageData;
		filter: ModAvailableFilterData;
	}> {
		logger.debug("Fetching published mods", { page: query.page, size: query.size, filterApplied: !!query.filter });

		const result = await this.deps.modRepository.findAllPublishedMods(query);
		const maintainers = await this.deps.userRepository.findAllByIds(result.maintainers);

		const pageData: PageData = {
			number: query.page,
			size: query.size,
			totalPages: Math.ceil(result.count / query.size) || 1,
			totalElements: result.count,
		};

		const filter: ModAvailableFilterData = {
			categories: result.categories,
			maintainers,
			tags: result.tags,
		};

		logger.info("Published mods fetched", { count: result.data.length, totalElements: result.count });

		return {
			data: ModSummaryData.array().parse(result.data),
			page: PageData.parse(pageData),
			filter: ModAvailableFilterData.parse(filter),
		};
	}

	async getModById(
		modId: string,
	): Promise<[{ mod: ModData; maintainers: UserData[] }, null] | [undefined, ModNotFoundError]> {
		logger.debug("Fetching mod by ID", { modId });

		const result = await this.deps.modRepository.findPublicModById(modId);

		if (!result) {
			logger.info("Mod not found", { modId });
			return [undefined, new ModNotFoundError()];
		}

		const maintainers = await this.deps.userRepository.findAllByIds(result.maintainers);
		logger.info("Mod retrieved", { modId, name: result.name });

		return [
			{
				mod: result,
				maintainers,
			},
			null,
		];
	}

	async getAllFeaturedMods(): Promise<ModSummaryData[]> {
		logger.debug("Fetching featured mods");
		const mods = await this.deps.modRepository.findAllFeaturedMods();
		logger.info("Featured mods fetched", { count: mods.length });
		return mods;
	}

	async getAllPopularMods(): Promise<ModSummaryData[]> {
		logger.debug("Fetching popular mods");
		const mods = await this.deps.modRepository.findAllPopularMods();
		logger.info("Popular mods fetched", { count: mods.length });
		return mods;
	}

	async getAllTags(): Promise<string[]> {
		logger.debug("Fetching all tags");
		return this.deps.modRepository.findAllTags();
	}

	async getCategoryCounts(): Promise<Record<ModCategory, number>> {
		logger.debug("Fetching category counts");
		const counts = await this.deps.modRepository.getCategoryCounts();

		// Ensure all categories are present with at least 0 count
		const result: Record<ModCategory, number> = Object.values(ModCategoryValues).reduce(
			(acc, category) => {
				acc[category] = 0;
				return acc;
			},
			{} as Record<ModCategory, number>,
		);

		for (const [category, count] of Object.entries(counts)) {
			result[category as ModCategory] = count;
		}

		logger.debug("Category counts fetched");
		return result;
	}

	async getServerMetrics(): Promise<{ totalMods: number; totalDownloads: number }> {
		logger.debug("Fetching server metrics");
		const metrics = await this.deps.modRepository.getServerMetrics();
		logger.info("Server metrics", metrics);
		return ServerMetricsData.parse(metrics);
	}

	async findPublicModReleases(modId: string): Promise<[ModReleaseData[], null] | [undefined, NotFoundError]> {
		logger.debug("Fetching mod releases", { modId });

		const releases = await this.deps.modRepository.findPublicModReleases(modId);

		if (releases === undefined) {
			logger.info("Mod not found for releases", { modId });
			return [undefined, new NotFoundError()];
		}

		logger.info("Mod releases fetched", { modId, count: releases.length });
		return [releases, null];
	}

	async findPublicModReleaseById(
		modId: string,
		releaseId: string,
	): Promise<[ModReleaseData, null] | [undefined, ModNotFoundError | ReleaseNotFoundError]> {
		logger.debug("Fetching mod release", { modId, releaseId });

		const release = await this.deps.modRepository.findPublicModRelease(modId, releaseId);

		if (!release) {
			logger.info("Release not found", { modId, releaseId });
			return [undefined, new ReleaseNotFoundError()];
		}

		logger.info("Release retrieved", { modId, releaseId, version: release.version });
		return [release, null];
	}

	async findLatestPublicModRelease(
		modId: string,
	): Promise<[ModReleaseData, null] | [undefined, ModNotFoundError | ReleaseNotFoundError]> {
		logger.debug("Fetching latest release", { modId });

		const release = await this.deps.modRepository.findLatestPublicModRelease(modId);

		if (!release) {
			logger.info("Latest release not found", { modId });
			return [undefined, new ReleaseNotFoundError()];
		}

		logger.info("Latest release retrieved", { modId, version: release.version });
		return [release, null];
	}

	async findUpdateInformationByIds(
		modIds: string[],
	): Promise<{ modId: string; id: string; version: string; createdAt: string }[]> {
		logger.debug("Fetching update information", { modCount: modIds.length });
		const updates = await this.deps.modRepository.findUpdateInformationByIds(modIds);
		logger.info("Update information fetched", { requested: modIds.length, found: updates.length });
		return updates;
	}
}

import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import { err, ok, type Result } from "neverthrow";
import type { ModCategory } from "../enums/ModCategory.ts";
import { ModCategory as ModCategoryValues } from "../enums/ModCategory.ts";
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

	@Log(logger)
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
		logger.debug({ page: query.page, size: query.size, filter: query.filter }, "getAllPublishedMods start");

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

		return {
			data: ModSummaryData.array().parse(result.data),
			page: PageData.parse(pageData),
			filter: ModAvailableFilterData.parse(filter),
		};
	}

	@Log(logger)
	async getModById(modId: string): Promise<Result<{ mod: ModData; maintainers: UserData[] }, "ModNotFound">> {
		logger.debug({ modId }, "getModById start");

		const result = await this.deps.modRepository.findPublicModById(modId);

		if (!result) {
			logger.debug({ modId }, "Mod not found");
			return err("ModNotFound");
		}

		const maintainers = await this.deps.userRepository.findAllByIds(result.maintainers);

		return ok({
			mod: result,
			maintainers,
		});
	}

	@Log(logger)
	async getAllFeaturedMods(): Promise<ModSummaryData[]> {
		logger.debug("getAllFeaturedMods start");
		return this.deps.modRepository.findAllFeaturedMods();
	}

	@Log(logger)
	async getAllPopularMods(): Promise<ModSummaryData[]> {
		logger.debug("getAllPopularMods start");
		return this.deps.modRepository.findAllPopularMods();
	}

	@Log(logger)
	async getAllTags(): Promise<string[]> {
		logger.debug("getAllTags start");
		return this.deps.modRepository.findAllTags();
	}

	@Log(logger)
	async getCategoryCounts(): Promise<Record<ModCategory, number>> {
		logger.debug("getCategoryCounts start");
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

		return result;
	}

	@Log(logger)
	async getServerMetrics(): Promise<{ totalMods: number; totalDownloads: number }> {
		logger.debug("getServerMetrics start");
		const metrics = await this.deps.modRepository.getServerMetrics();
		return ServerMetricsData.parse(metrics);
	}

	@Log(logger)
	async findPublicModReleases(modId: string): Promise<Result<ModReleaseData[], "NotFound">> {
		logger.debug({ modId }, "findPublicModReleases start");

		const releases = await this.deps.modRepository.findPublicModReleases(modId);

		if (releases === undefined) {
			logger.debug({ modId }, "Mod not found");
			return err("NotFound");
		}

		return ok(releases);
	}

	@Log(logger)
	async findPublicModReleaseById(
		modId: string,
		releaseId: string,
	): Promise<Result<ModReleaseData, "ModNotFound" | "ReleaseNotFound">> {
		logger.debug({ modId, releaseId }, "findPublicModReleaseById start");

		const release = await this.deps.modRepository.findPublicModRelease(modId, releaseId);

		if (!release) {
			// We can't distinguish between mod not found and release not found here
			// but we'll return ReleaseNotFound as the primary error
			logger.debug({ modId, releaseId }, "Release not found");
			return err("ReleaseNotFound");
		}

		return ok(release);
	}

	@Log(logger)
	async findLatestPublicModRelease(modId: string): Promise<Result<ModReleaseData, "ModNotFound" | "ReleaseNotFound">> {
		logger.debug({ modId }, "findLatestPublicModRelease start");

		const release = await this.deps.modRepository.findLatestPublicModRelease(modId);

		if (!release) {
			logger.debug({ modId }, "Latest release not found");
			return err("ReleaseNotFound");
		}

		return ok(release);
	}

	@Log(logger)
	async findUpdateInformationByIds(
		modIds: string[],
	): Promise<{ modId: string; id: string; version: string; createdAt: string }[]> {
		logger.debug({ modIds }, "findUpdateInformationByIds start");
		return this.deps.modRepository.findUpdateInformationByIds(modIds);
	}
}

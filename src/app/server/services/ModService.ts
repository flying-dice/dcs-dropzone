import Logger from "../Logger.ts";
import type { ModRepository } from "../repository/ModRepository.ts";
import type { ModSummaryRepository } from "../repository/ModSummaryRepository.ts";
import type { ModData } from "../schemas/ModData.ts";
import type { ModSummaryData } from "../schemas/ModSummaryData.ts";
import type { PageData } from "../schemas/PageData.ts";

const logger = Logger.getLogger("ModService");

export enum ModServiceError {
	NotFound = "NotFound",
}

export class ModService {
	constructor(
		private readonly modRepository: ModRepository,
		private readonly modSummaryRepository: ModSummaryRepository,
	) {}

	async findAllMods(
		page: number,
		size: number,
	): Promise<{ data: ModData[]; page: PageData }> {
		logger.debug({ page }, "findAllMods start");

		const result = await this.modRepository.getAll(page, size);
		const pageData: PageData = {
			number: page,
			size: size,
			totalPages: Math.ceil(result.page.total / size) || 1,
			totalElements: result.page.total,
		};

		logger.debug({ pageData }, "findAllMods success");

		return {
			data: result.data.map((it) => it.toData()),
			page: pageData,
		};
	}

	async findAllModSummaries(
		page: number,
		size: number,
	): Promise<{ data: ModSummaryData[]; page: PageData }> {
		logger.debug({ page }, "findAllModSummaries start");
		const result = await this.modSummaryRepository.getAll(page, size);
		const pageData: PageData = {
			number: page,
			size: size,
			totalPages: Math.ceil(result.page.total / size) || 1,
			totalElements: result.page.total,
		};

		logger.debug({ pageData }, "findAllModSummaries success");

		return {
			data: result.data.map((it) => it.toData()),
			page: pageData,
		};
	}
}

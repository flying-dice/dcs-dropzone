import type { Db } from "mongodb";
import { ModSummary } from "../../domain/ModSummary.ts";
import Logger from "../../Logger.ts";
import { ModSummaryDocument } from "../../schemas/ModSummaryDocument.ts";
import type { ModSummaryRepository } from "../ModSummaryRepository.ts";
import { MongoRepository } from "./MongoRepository.ts";

const logger = Logger.getLogger("MongoModSummaryRepository");

export class MongoModSummaryRepository
	extends MongoRepository<ModSummary, ModSummaryDocument>
	implements ModSummaryRepository
{
	constructor(db: Db) {
		super(logger, db, "mods");
	}

	async postConstruct(): Promise<void> {}

	override async getAll(
		page: number,
		size: number,
	): Promise<{ data: ModSummary[]; page: { total: number } }> {
		logger.debug({ page }, "MongoModSummaryRepository getAll called");
		return super.getAll(page, size, {
			id: 1,
			name: 1,
			category: 1,
			description: 1,
			tags: 1,
			thumbnail: 1,
			maintainers: 1,
		});
	}

	protected toDomain(document: ModSummaryDocument): ModSummary {
		return new ModSummary({
			id: document.id,
			name: document.name,
			category: document.category,
			description: document.description,
			tags: document.tags ?? [],
			thumbnail: document.thumbnail,
			maintainers: document.maintainers ?? [],
		});
	}

	protected toDocument(domain: ModSummary): ModSummaryDocument {
		const s = domain.toData();
		return ModSummaryDocument.parse({
			id: s.id,
			name: s.name,
			category: s.category,
			description: s.description,
			tags: s.tags ?? [],
			thumbnail: s.thumbnail,
			maintainers: s.maintainers,
		});
	}
}

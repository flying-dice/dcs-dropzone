import type { Db } from "mongodb";
import { Mod } from "../../domain/Mod.ts";
import type { User } from "../../domain/User.ts";
import Logger from "../../Logger.ts";
import { ModDocument } from "../../schemas/ModDocument.ts";
import type { ModRepository } from "../ModRepository.ts";
import { MongoRepository } from "./MongoRepository.ts";

const logger = Logger.getLogger("MongoModRepository");

export class MongoModRepository
	extends MongoRepository<Mod, ModDocument>
	implements ModRepository
{
	constructor(db: Db) {
		super(logger, db, "mods");
	}

	async postConstruct(): Promise<void> {
		logger.debug("Ensuring indexes for 'mods' collection");
		await this.col.createIndex({ id: 1 }, { unique: true });
		await this.col.createIndex({ maintainers: 1 });
		logger.debug("Indexes ensured for 'mods'");
	}

	async getNextId(): Promise<string> {
		const id = crypto.randomUUID();
		logger.debug({ id }, "Generated next mod id");
		return id;
	}

	async getByMaintainer(maintainer: User): Promise<Mod[]> {
		logger.debug({ maintainerId: maintainer.id }, "Query mods by maintainer");
		const cursor = this.col.find({ maintainers: maintainer.id });
		const docs = await cursor.toArray();
		logger.debug(
			{ maintainerId: maintainer.id, count: docs.length },
			"Mods by maintainer fetched",
		);
		return docs.map((d) => this.toDomain(d));
	}

	protected toDomain(document: ModDocument): Mod {
		return new Mod({
			id: document.id,
			name: document.name,
			category: document.category,
			description: document.description,
			content: document.content,
			tags: document.tags ?? [],
			dependencies: document.dependencies ?? [],
			screenshots: document.screenshots ?? [],
			thumbnail: document.thumbnail,
			visibility: document.visibility,
			maintainers: document.maintainers ?? [],
		});
	}

	protected toDocument(domain: Mod): ModDocument {
		const s = domain.toData();
		return ModDocument.parse({
			id: s.id,
			name: s.name,
			category: s.category,
			description: s.description,
			content: s.content,
			tags: s.tags ?? [],
			dependencies: s.dependencies ?? [],
			screenshots: s.screenshots ?? [],
			thumbnail: s.thumbnail,
			visibility: s.visibility,
			maintainers: s.maintainers,
		});
	}
}

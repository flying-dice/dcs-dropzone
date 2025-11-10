import type { Db } from "mongodb";
import { Mod } from "../../domain/Mod.ts";
import type { User } from "../../domain/User.ts";
import { ModDocument } from "../../schemas/ModDocument.ts";
import type { ModRepository } from "../ModRepository.ts";
import { MongoRepository } from "./MongoRepository.ts";

export class MongoModRepository
	extends MongoRepository<Mod, ModDocument>
	implements ModRepository
{
	constructor(db: Db) {
		super(db, "mods");
	}

	async postConstruct(): Promise<void> {
		await this.col.createIndex({ id: 1 }, { unique: true });
		await this.col.createIndex({ maintainers: 1 });
	}

	async getNextId(): Promise<string> {
		return crypto.randomUUID();
	}

	async getByMaintainer(maintainer: User): Promise<Mod[]> {
		const cursor = this.col.find({ maintainers: maintainer.id });
		const docs = await cursor.toArray();
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

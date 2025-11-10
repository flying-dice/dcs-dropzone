import type { Collection, Db, Filter, WithId } from "mongodb";
import type { Identifiable, Repository } from "../Repository.ts";

export abstract class MongoRepository<
	DOMAIN extends Identifiable,
	DOCUMENT extends Identifiable,
> implements Repository<DOMAIN>
{
	protected readonly col: Collection<DOCUMENT>;

	protected constructor(db: Db, collectionName: string) {
		this.col = db.collection<DOCUMENT>(collectionName);
	}

	async getById(id: string): Promise<DOMAIN | undefined> {
		const doc = await this.col.findOne({ id } as Filter<DOCUMENT>);
		return doc ? this.toDomain(doc) : undefined;
	}

	async save(entity: DOMAIN): Promise<void> {
		const document = this.toDocument(entity);

		await this.col.updateOne(
			{ id: document.id } as Filter<DOCUMENT>,
			{ $set: document },
			{ upsert: true },
		);
	}

	async delete(id: string): Promise<void> {
		await this.col.deleteOne({ id } as Filter<DOCUMENT>);
	}

	abstract postConstruct(): Promise<void>;

	protected abstract toDomain(document: WithId<DOCUMENT> | DOCUMENT): DOMAIN;

	protected abstract toDocument(domain: DOMAIN): DOCUMENT;
}

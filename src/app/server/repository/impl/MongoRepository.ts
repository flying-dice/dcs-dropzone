import type { Collection, Db, Filter, WithId } from "mongodb";
import type { Logger } from "pino";
import type { Identifiable, Repository } from "../Repository.ts";

export abstract class MongoRepository<
	DOMAIN extends Identifiable,
	DOCUMENT extends Identifiable,
> implements Repository<DOMAIN>
{
	protected readonly col: Collection<DOCUMENT>;

	private readonly logger: Logger;

	protected constructor(logger: Logger, db: Db, collectionName: string) {
		this.logger = logger;
		this.col = db.collection<DOCUMENT>(collectionName);
	}

	async getAll(
		page: number,
		size: number,
		projectFields?: Partial<Record<keyof DOCUMENT, 1 | 0>>,
	): Promise<{ data: DOMAIN[]; page: { total: number } }> {
		this.logger.debug({ page }, "getAll called");

		const countDocs = await this.col.countDocuments();

		let cursor = this.col.find({});

		if (projectFields) {
			this.logger.debug({ projectFields }, "getAll applying projection");
			cursor = cursor.project(projectFields);
		}

		cursor = cursor.skip((page - 1) * size).limit(size);

		const docs = await cursor.toArray();
		this.logger.debug({ count: docs.length }, "getAll fetched");
		return {
			data: docs.map((d) => this.toDomain(d)),
			page: { total: countDocs },
		};
	}

	async getById(id: string): Promise<DOMAIN | undefined> {
		this.logger.debug({ id }, "getById called");
		const doc = await this.col.findOne({ id } as Filter<DOCUMENT>);
		if (!doc) {
			this.logger.debug({ id }, "getById not found");
			return undefined;
		}
		this.logger.debug({ id }, "getById found");
		return this.toDomain(doc);
	}

	async save(entity: DOMAIN): Promise<void> {
		const document = this.toDocument(entity);
		this.logger.debug({ id: document.id }, "save upsert start");
		const res = await this.col.updateOne(
			{ id: document.id } as Filter<DOCUMENT>,
			{ $set: document },
			{ upsert: true },
		);
		this.logger.debug(
			{
				id: document.id,
				matchedCount: res.matchedCount,
				modifiedCount: res.modifiedCount,
				upsertedId: res.upsertedId,
			},
			"save upsert complete",
		);
	}

	async delete(id: string): Promise<void> {
		this.logger.debug({ id }, "delete start");
		const res = await this.col.deleteOne({
			id,
		} as Filter<DOCUMENT>);
		this.logger.debug(
			{ id, deletedCount: res.deletedCount },
			"delete complete",
		);
	}

	abstract postConstruct(): Promise<void>;

	protected abstract toDomain(document: WithId<DOCUMENT> | DOCUMENT): DOMAIN;

	protected abstract toDocument(domain: DOMAIN): DOCUMENT;
}

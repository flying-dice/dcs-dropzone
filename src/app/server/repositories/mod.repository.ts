import type { Collection } from "mongodb";
import type {
	CreateMod,
	Mod,
	ModSummary,
	UpdateMod,
} from "../domain/mod.schema.ts";
import { modSchema, modSummarySchema } from "../domain/mod.schema.ts";

/**
 * Repository interface for Mod domain entity
 * Follows the Repository pattern from DDD
 */
export interface ModRepository {
	/**
	 * Find a mod by its unique identifier
	 * @param id - The unique identifier of the mod
	 * @returns The mod if found, undefined otherwise
	 */
	findById(id: string): Promise<Mod | undefined>;

	/**
	 * Find all mods (summary view without content and versions)
	 * @returns Array of mod summaries
	 */
	findAll(): Promise<ModSummary[]>;

	/**
	 * Find mods by maintainer user ID
	 * @param userId - The user ID of the maintainer
	 * @returns Array of mods maintained by the user
	 */
	findByMaintainer(userId: string): Promise<ModSummary[]>;

	/**
	 * Create a new mod
	 * @param mod - The mod data to create
	 * @returns The created mod
	 */
	create(mod: CreateMod): Promise<Mod>;

	/**
	 * Update an existing mod
	 * @param id - The unique identifier of the mod
	 * @param updates - The fields to update
	 * @returns The updated mod if found, undefined otherwise
	 */
	update(id: string, updates: UpdateMod): Promise<Mod | undefined>;

	/**
	 * Delete a mod by its unique identifier
	 * @param id - The unique identifier of the mod
	 * @returns True if the mod was deleted, false otherwise
	 */
	delete(id: string): Promise<boolean>;

	/**
	 * Check if a mod exists
	 * @param id - The unique identifier of the mod
	 * @returns True if the mod exists, false otherwise
	 */
	exists(id: string): Promise<boolean>;
}

/**
 * MongoDB implementation of the ModRepository
 */
export class MongoModRepository implements ModRepository {
	constructor(private collection: Collection) {}

	async findById(id: string): Promise<Mod | undefined> {
		const doc = await this.collection.findOne({ id });
		if (!doc) return undefined;

		// Remove MongoDB _id field and parse with schema
		const { _id, ...modData } = doc;
		return modSchema.parse(modData);
	}

	async findAll(): Promise<ModSummary[]> {
		const docs = await this.collection
			.find({})
			.project({ content: 0, versions: 0 })
			.toArray();

		return docs.map((doc) => {
			const { _id, ...modData } = doc;
			return modSummarySchema.parse(modData);
		});
	}

	async findByMaintainer(userId: string): Promise<ModSummary[]> {
		const docs = await this.collection
			.find({ maintainers: userId })
			.project({ content: 0, versions: 0 })
			.toArray();

		return docs.map((doc) => {
			const { _id, ...modData } = doc;
			return modSummarySchema.parse(modData);
		});
	}

	async create(mod: CreateMod): Promise<Mod> {
		// Parse the create schema and create a full mod with defaults
		const newMod = modSchema.parse(mod);

		// MongoDB expects Document type, but our Mod type is compatible
		await this.collection.insertOne(newMod as Record<string, unknown>);

		return newMod;
	}

	async update(id: string, updates: UpdateMod): Promise<Mod | undefined> {
		const result = await this.collection.findOneAndUpdate(
			{ id },
			{ $set: updates },
			{ returnDocument: "after" },
		);

		if (!result) return undefined;

		const { _id, ...modData } = result;
		return modSchema.parse(modData);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.collection.deleteOne({ id });
		return result.deletedCount === 1;
	}

	async exists(id: string): Promise<boolean> {
		const count = await this.collection.countDocuments({ id }, { limit: 1 });
		return count > 0;
	}
}

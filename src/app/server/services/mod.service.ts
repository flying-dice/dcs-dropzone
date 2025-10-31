import type {
	CreateMod,
	Mod,
	ModSummary,
	UpdateMod,
} from "../domain/mod.schema.ts";
import type { ModRepository } from "../repositories/mod.repository.ts";

/**
 * Service class for Mod business logic
 * Follows the Service pattern from DDD
 */
export class ModService {
	constructor(private repository: ModRepository) {}

	/**
	 * Get a mod by its ID
	 * @param id - The unique identifier of the mod
	 * @returns The mod if found, undefined otherwise
	 */
	async getModById(id: string): Promise<Mod | undefined> {
		return this.repository.findById(id);
	}

	/**
	 * Get all mods (summary view)
	 * @returns Array of mod summaries
	 */
	async getAllMods(): Promise<ModSummary[]> {
		return this.repository.findAll();
	}

	/**
	 * Get mods maintained by a specific user
	 * @param userId - The user ID of the maintainer
	 * @returns Array of mods maintained by the user
	 */
	async getModsByMaintainer(userId: string): Promise<ModSummary[]> {
		return this.repository.findByMaintainer(userId);
	}

	/**
	 * Create a new mod
	 * @param mod - The mod data to create
	 * @param userId - The user ID of the creator
	 * @returns The created mod
	 * @throws Error if mod with the same ID already exists
	 */
	async createMod(mod: CreateMod, userId: string): Promise<Mod> {
		// Check if mod already exists
		const exists = await this.repository.exists(mod.id);
		if (exists) {
			throw new Error(`Mod with id '${mod.id}' already exists`);
		}

		// Ensure the creator is in the maintainers list
		const maintainers = mod.maintainers.includes(userId)
			? mod.maintainers
			: [...mod.maintainers, userId];

		return this.repository.create({
			...mod,
			maintainers,
		});
	}

	/**
	 * Update an existing mod
	 * @param id - The unique identifier of the mod
	 * @param updates - The fields to update
	 * @param userId - The user ID of the requester
	 * @returns The updated mod if found and user is authorized, undefined otherwise
	 * @throws Error if user is not a maintainer
	 */
	async updateMod(
		id: string,
		updates: UpdateMod,
		userId: string,
	): Promise<Mod | undefined> {
		// Check if mod exists and user is a maintainer
		const mod = await this.repository.findById(id);
		if (!mod) {
			return undefined;
		}

		if (!mod.maintainers.includes(userId)) {
			throw new Error("User is not a maintainer of this mod");
		}

		return this.repository.update(id, updates);
	}

	/**
	 * Delete a mod
	 * @param id - The unique identifier of the mod
	 * @param userId - The user ID of the requester
	 * @returns True if the mod was deleted, false if not found
	 * @throws Error if user is not a maintainer
	 */
	async deleteMod(id: string, userId: string): Promise<boolean> {
		// Check if mod exists and user is a maintainer
		const mod = await this.repository.findById(id);
		if (!mod) {
			return false;
		}

		if (!mod.maintainers.includes(userId)) {
			throw new Error("User is not a maintainer of this mod");
		}

		return this.repository.delete(id);
	}

	/**
	 * Check if a mod exists
	 * @param id - The unique identifier of the mod
	 * @returns True if the mod exists, false otherwise
	 */
	async modExists(id: string): Promise<boolean> {
		return this.repository.exists(id);
	}
}

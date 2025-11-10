import type { Mod } from "../domain/Mod.ts";
import type { User } from "../domain/User.ts";
import type { Repository } from "./Repository.ts";

/**
 * Interface representing a repository for managing `Mod` entities.
 */
export interface ModRepository extends Repository<Mod> {
	/**
	 * Generates and returns the next unique identifier for a `Mod`.
	 * @returns {Promise<string>} A promise that resolves to the next unique ID.
	 */
	getNextId(): Promise<string>;

	/**
	 * Retrieves all `Mod` entities associated with a specific maintainer.
	 * @param {User} maintainer - The maintainer whose mods are to be retrieved.
	 * @returns {Promise<Mod[]>} A promise that resolves to an array of `Mod` entities.
	 */
	getByMaintainer(maintainer: User): Promise<Mod[]>;
}

import type { Mod } from "../domain/Mod.ts";
import type { User } from "../domain/User.ts";

/**
 * Interface representing a repository for managing `Mod` entities.
 */
export interface ModRepository {
	/**
	 * Generates and returns the next unique identifier for a `Mod`.
	 * @returns {Promise<string>} A promise that resolves to the next unique ID.
	 */
	getNextId(): Promise<string>;

	/**
	 * Retrieves a `Mod` by its unique identifier.
	 * @param {string} id - The unique identifier of the `Mod`.
	 * @returns {Promise<Mod | undefined>} A promise that resolves to the `Mod` if found, or `undefined` if not.
	 */
	getById(id: string): Promise<Mod | undefined>;

	/**
	 * Retrieves all `Mod` entities associated with a specific maintainer.
	 * @param {User} maintainer - The maintainer whose mods are to be retrieved.
	 * @returns {Promise<Mod[]>} A promise that resolves to an array of `Mod` entities.
	 */
	getByMaintainer(maintainer: User): Promise<Mod[]>;

	/**
	 * Saves a `Mod` entity to the repository.
	 * @param {Mod} mod - The `Mod` entity to save.
	 * @returns {Promise<void>} A promise that resolves when the operation is complete.
	 */
	save(mod: Mod): Promise<void>;

	/**
	 * Deletes a `Mod` entity from the repository by its unique identifier.
	 * @param {string} id - The unique identifier of the `Mod` to delete.
	 * @returns {Promise<void>} A promise that resolves when the operation is complete.
	 */
	delete(id: string): Promise<void>;
}

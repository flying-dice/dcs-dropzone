import type { User } from "../domain/User.ts";

/**
 * Interface representing a repository for managing `User` entities.
 */
export interface UserRepository {
	/**
	 * Retrieves a `User` by their unique identifier.
	 * @param {string} id - The unique identifier of the `User`.
	 * @returns {Promise<User | undefined>} A promise that resolves to the `User` if found, or `undefined` if not.
	 */
	getById(id: string): Promise<User | undefined>;

	getByIdOrThrow(id: string): Promise<User>;

	/**
	 * Saves a `User` entity to the repository.
	 * @param {User} User - The `User` entity to save.
	 * @returns {Promise<void>} A promise that resolves when the operation is complete.
	 */
	save(User: User): Promise<void>;

	/**
	 * Deletes a `User` entity from the repository by their unique identifier.
	 * @param {string} id - The unique identifier of the `User` to delete.
	 * @returns {Promise<void>} A promise that resolves when the operation is complete.
	 */
	delete(id: string): Promise<void>;
}

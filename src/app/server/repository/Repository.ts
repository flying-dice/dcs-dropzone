export interface Identifiable {
	id: string;
}

/**
 * Interface representing a generic repository.
 *
 * This interface defines the contract for repository implementations,
 * which may include initialization logic to be executed after construction.
 *
 * @template T - The type of the entity managed by the repository. Must include an `id` property of type `string`.
 */
export interface Repository<T extends Identifiable> {
	/**
	 * Method to be called after the repository is constructed.
	 *
	 * This method is intended to perform any necessary initialization
	 * or setup tasks required for the repository to function properly,
	 * such as applying database migrations, creating indexes, etc.
	 *
	 * @returns A promise that resolves when the initialization is complete.
	 */
	postConstruct(): Promise<void>;

	/**
	 * Retrieves an entity by its unique identifier.
	 *
	 * @param id - The unique identifier of the entity to retrieve.
	 * @returns A promise that resolves to the entity if found, or `undefined` if not found.
	 */
	getById(id: string): Promise<T | undefined>;

	/**
	 * Saves an entity to the repository.
	 *
	 * If the entity already exists, it will be updated. Otherwise, a new entity will be created.
	 *
	 * @param entity - The entity to save.
	 * @returns A promise that resolves when the save operation is complete.
	 */
	save(entity: T): Promise<void>;

	/**
	 * Deletes an entity from the repository by its unique identifier.
	 *
	 * @param id - The unique identifier of the entity to delete.
	 * @returns A promise that resolves when the delete operation is complete.
	 */
	delete(id: string): Promise<void>;
}

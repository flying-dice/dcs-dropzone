import type { ModDto } from "../dto/ModDto.ts";

/**
 * Enum representing possible errors that can occur in the ModService.
 */
export enum ModServiceError {
	NotMaintainer = "NotMaintainer",
	NotFound = "NotFound",
	UserNotFound = "UserNotFound",
}

export interface ModService {
	/**
	 * Retrieves all mods maintained by the current user.
	 * @returns A promise that resolves to an array of Mod DTOs.
	 */
	findAllUserMods(): Promise<ModDto[] | ModServiceError>;

	/**
	 * Retrieves a specific mod by its ID if the current user is a maintainer.
	 * @param modId - The ID of the mod to retrieve.
	 * @returns A promise that resolves to the Mod DTO or a ModServiceError.
	 */
	findUserModById(modId: string): Promise<ModDto | ModServiceError>;

	/**
	 * Creates a new mod with the current user as the maintainer.
	 * @param name - The name of the new mod.
	 * @returns A promise that resolves when the mod is created.
	 */
	createMod(name: string): Promise<void | ModServiceError>;

	/**
	 * Updates an existing mod if the current user is a maintainer.
	 * @param modDto - The DTO containing the updated mod properties.
	 * @returns A promise that resolves to undefined or a ModServiceError.
	 */
	updateMod(modDto: ModDto): Promise<undefined | ModServiceError>;

	/**
	 * Deletes a mod if the current user is a maintainer.
	 * @param id - The ID of the mod to delete.
	 * @returns A promise that resolves to undefined or a ModServiceError.
	 */
	deleteMod(id: string): Promise<undefined | ModServiceError>;
}

/**
 * Represents release data needed for asset management
 */
export type ReleaseData = {
	releaseId: string;
	modId: string;
	modName: string;
	version: string;
};

/**
 * Represents a release asset
 */
export type ReleaseAsset = {
	id: string;
	releaseId: string;
	name: string;
	isArchive: boolean;
	urls: string[];
};

/**
 * Repository interface for release asset data access
 */
export interface ReleaseAssetRepository {
	/**
	 * Gets the release data for a given release ID
	 * @param releaseId The release ID to look up
	 * @returns The release data or undefined if not found
	 */
	getReleaseById(releaseId: string): ReleaseData | undefined;

	/**
	 * Gets all assets for a given release
	 * @param releaseId The release ID to get assets for
	 * @returns Array of release assets
	 */
	getAssetsForRelease(releaseId: string): ReleaseAsset[];
}

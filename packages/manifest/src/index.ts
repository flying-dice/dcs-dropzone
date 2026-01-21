import { z } from "zod";

/**
 * Zod schema for validating the structure of a manifest data object.
 * - `__version` (optional): The version of the manifest as a string.
 * - `__tag` (optional): A tag associated with the manifest as a string.
 * - `createdAt`: The creation date of the manifest as a `Date` object.
 * - `etag`: A SHA-256 hash string representing the entity tag of the manifest.
 * - `files`: An array of file paths as strings.
 */
export const ManifestData = z.object({
	__version: z.string().optional(),
	__tag: z.string().optional(),
	createdAt: z.coerce.date(),
	etag: z.hash("sha256"),
	files: z.array(z.string()),
});

/**
 * TypeScript type inferred from the `ManifestData` schema.
 * Represents the structure of a manifest data object.
 */
export type ManifestData = z.infer<typeof ManifestData>;

/**
 * Fetches a manifest from a given URL and validates its structure.
 *
 * @param url - The URL to fetch the manifest from.
 * @returns A promise that resolves to a validated `ManifestData` object.
 * @throws An error if the fetch request fails or the data does not match the schema.
 */
export async function fetchManifest(url: string): Promise<ManifestData> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
	}
	const data = await response.json();
	return ManifestData.parse(data);
}

/**
 * Reads a manifest from a local file and validates its structure.
 *
 * @param path - The file path to read the manifest from.
 * @returns A promise that resolves to a validated `ManifestData` object.
 * @throws An error if the file cannot be read or the data does not match the schema.
 */
export async function readManifest(path: string): Promise<ManifestData> {
	const file = Bun.file(path, { type: "application/json" });
	const data = await file.json();
	return ManifestData.parse(data);
}

/**
 * Writes a manifest to a local file after validating its structure.
 *
 * @param path - The file path to write the manifest to.
 * @param data - The manifest data to write, which will be validated against the schema.
 * @returns A promise that resolves when the write operation is complete.
 * @throws An error if the data does not match the schema or the file cannot be written.
 */
export async function writeManifest(path: string, data: ManifestData): Promise<void> {
	const file = Bun.file(path, { type: "application/json" });
	const parsedData = ManifestData.parse(data);
	const json = JSON.stringify(parsedData, null, 2);
	await Bun.write(file, json);
}

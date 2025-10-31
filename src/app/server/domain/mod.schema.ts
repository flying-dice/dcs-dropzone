import { z } from "zod";

/**
 * Default content for new mods (base64 encoded message)
 * Decoded: "Add a good readme so users can understand your mod..."
 */
export const DEFAULT_MOD_CONTENT =
	"QWRkIGEgZ29vZCByZWFkbWUgc28gdXNlcnMgY2FuIHVuZGVyc3RhbmQgeW91ciBtb2QuLi4=";

/**
 * Schema for a release/version of a mod
 */
export const releaseSchema = z.object({
	releasepage: z.string().url().describe("The release page of the release"),
	name: z.string().describe("The name of the release"),
	version: z.string().describe("The version of the release"),
	date: z.coerce.date().describe("The date of the release"),
	exePath: z.string().describe("Executable file specifically Tools").optional(),
	assets: z
		.array(
			z.object({
				remoteSource: z.string().describe("The URL of the file to download"),
				links: z.array(
					z.object({
						source: z
							.string()
							.describe(
								"The name of the file # separates download path and internal zip path",
							),
						target: z
							.string()
							.describe(
								"The name of the installation location relative to install path",
							)
							.refine((it) => !it.includes("\\"), {
								message:
									"The target path cannot contain backslashes, use unix style paths i.e. '/'",
							}),
						runonstart: z
							.boolean()
							.optional()
							.describe(
								"Run on simulation (mission) start, note that this will execute the script before the mission environment is sanitized",
							),
					}),
				),
			}),
		)
		.describe("The array of files to install"),
});

/**
 * Main mod schema with all fields
 */
export const modSchema = z.object({
	id: z
		.string()
		.regex(
			/^[a-z0-9-]+$/,
			"The Mod id must be a url safe path specifically kebab case formatted",
		),
	homepage: z.string().url().describe("The homepage of the mod"),
	name: z.string().describe("The name of the mod"),
	description: z
		.string()
		.describe("A short description of the mod to be displayed in the mod tile"),
	authors: z
		.array(z.string())
		.min(1)
		.describe("The authors of the mod as a list of strings"),
	tags: z
		.array(z.string())
		.default([])
		.describe(
			"The tags of the mod, these are used to filter mods in the mod browser",
		),
	category: z
		.string()
		.default("Uncategorized")
		.describe(
			"The category of the mod, this is used to group mods in the mod browser",
		),
	license: z.string().default("MIT License").describe("The license of the mod"),
	latest: z
		.string()
		.optional()
		.describe("The latest version of the mod to be pushed to the subscribers"),
	dependencies: z
		.array(
			z
				.string()
				.regex(
					/^[a-z0-9-]+$/,
					"The Mod dependency id must be a url safe path specifically kebab case formatted",
				),
		)
		.default([])
		.describe("The dependencies of the mod"),
	versions: z
		.array(releaseSchema)
		.default([])
		.describe("The versions of the mod"),
	imageUrl: z
		.string()
		.optional()
		.describe("The URL of the image to display in the mod tile"),
	content: z
		.string()
		.default(DEFAULT_MOD_CONTENT)
		.describe("The content of the mod"),
	published: z
		.boolean()
		.default(false)
		.describe("Whether the mod is published and visible to users"),
	maintainers: z
		.array(z.string())
		.min(1)
		.describe("The maintainers of the mod"),
});

/**
 * Mod summary schema (without content and versions for list views)
 */
export const modSummarySchema = modSchema.omit({
	content: true,
	versions: true,
});

/**
 * Schema for creating a new mod
 */
export const createModSchema = modSchema.pick({
	id: true,
	homepage: true,
	name: true,
	description: true,
	authors: true,
	maintainers: true,
});

/**
 * Schema for updating a mod (all fields optional except id)
 */
export const updateModSchema = modSchema.omit({ id: true }).partial();

// Type exports
export type Mod = z.infer<typeof modSchema>;
export type Release = z.infer<typeof releaseSchema>;
export type ModSummary = z.infer<typeof modSummarySchema>;
export type CreateMod = z.infer<typeof createModSchema>;
export type UpdateMod = z.infer<typeof updateModSchema>;

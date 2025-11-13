import { z } from "zod";
import { ModVisibility } from "../../../common/data.ts";

// Semantic version validation regex
const semverRegex =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

// URL validation for assets
const urlSchema = z.string().url("Invalid URL format");

// Asset schema
export const ModReleaseAssetData = z
	.object({
		name: z.string().min(1, "Asset name is required"),
		url: urlSchema,
	})
	.meta({
		ref: "ModReleaseAssetData",
		title: "Mod Release Asset Data",
		description: "Data representation of a mod release asset.",
	});

export type ModReleaseAssetData = z.infer<typeof ModReleaseAssetData>;

// ModRelease schema
export const ModReleaseData = z
	.object({
		id: z.string(),
		mod_id: z.string(),
		version: z
			.string()
			.regex(
				semverRegex,
				"Version must follow semantic versioning (e.g., 1.0.0, 2.1.3-beta)",
			),
		changelog: z.string(),
		assets: z.array(ModReleaseAssetData),
		visibility: z.enum(ModVisibility),
		createdAt: z.string().optional(),
		updatedAt: z.string().optional(),
	})
	.meta({
		ref: "ModReleaseData",
		title: "Mod Release Data",
		description: "Data representation of a mod release.",
	});

export type ModReleaseData = z.infer<typeof ModReleaseData>;

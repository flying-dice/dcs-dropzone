import { z } from "zod";
import { ModVisibility } from "../../../common/data.ts";

// Asset schema
export const ModReleaseAssetData = z
	.object({
		name: z.string().min(1, "Asset name is required"),
		url: z.string().url(),
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
		version: z.string(),
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

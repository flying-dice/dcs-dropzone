import { z } from "zod";
import { ModVisibility } from "../../../common/data.ts";

// Asset schema
export const ModReleaseAssetData = z
	.object({
		name: z.string().min(1, "Asset name is required"),
		urls: z.string().url().array(),
		isArchive: z.boolean(),
	})
	.meta({
		ref: "ModReleaseAssetData",
		title: "Mod Release Asset Data",
		description: "Data representation of a mod release asset.",
	});

export type ModReleaseAssetData = z.infer<typeof ModReleaseAssetData>;

// Symbolic link destination root options
export const SymbolicLinkDestRoot = [
	"DCS_WORKING_DIR",
	"DCS_INSTALL_DIR",
] as const;

// Symbolic link schema
export const ModReleaseSymbolicLinkData = z
	.object({
		src: z.string().min(1, "Source path is required"),
		dest: z.string().min(1, "Destination path is required"),
		destRoot: z.enum(SymbolicLinkDestRoot),
	})
	.meta({
		ref: "ModReleaseSymbolicLinkData",
		title: "Mod Release Symbolic Link Data",
		description: "Data representation of a symbolic link configuration.",
	});

export type ModReleaseSymbolicLinkData = z.infer<
	typeof ModReleaseSymbolicLinkData
>;

// ModRelease schema
export const ModReleaseData = z
	.object({
		id: z.string(),
		mod_id: z.string(),
		version: z.string(),
		changelog: z.string(),
		assets: z.array(ModReleaseAssetData),
		symbolicLinks: z.array(ModReleaseSymbolicLinkData).default([]),
		visibility: z.enum(ModVisibility),
		createdAt: z.coerce.string().optional(),
		updatedAt: z.coerce.string().optional(),
	})
	.meta({
		ref: "ModReleaseData",
		title: "Mod Release Data",
		description: "Data representation of a mod release.",
	});

export type ModReleaseData = z.infer<typeof ModReleaseData>;

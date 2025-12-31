import { z } from "zod";
import { MissionScriptRunOn } from "../enums/MissionScriptRunOn.ts";
import { ModVisibility } from "../enums/ModVisibility.ts";
import { SymbolicLinkDestRoot } from "../enums/SymbolicLinkDestRoot.ts";

// Asset schema
export const ModReleaseAssetData = z
	.object({
		id: z.string(),
		name: z.string().min(1, "Asset name is required"),
		urls: z
			.object({
				id: z.string(),
				url: z.url(),
			})
			.array(),
		isArchive: z.boolean(),
	})
	.meta({
		ref: "ModReleaseAssetData",
		title: "Mod Release Asset Data",
		description: "Data representation of a mod release asset.",
	});

export type ModReleaseAssetData = z.infer<typeof ModReleaseAssetData>;

// Symbolic link schema
export const ModReleaseSymbolicLinkData = z
	.object({
		id: z.string(),
		name: z.string().min(1, "Asset name is required"),
		src: z.string().min(1, "Source path is required"),
		dest: z.string().min(1, "Destination path is required"),
		destRoot: z.enum(SymbolicLinkDestRoot),
	})
	.meta({
		ref: "ModReleaseSymbolicLinkData",
		title: "Mod Release Symbolic Link Data",
		description: "Data representation of a symbolic link configuration.",
	});

export type ModReleaseSymbolicLinkData = z.infer<typeof ModReleaseSymbolicLinkData>;

// Mission script schema
export const ModReleaseMissionScriptData = z
	.object({
		id: z.string(),
		name: z.string().min(1, "Mission Script Name required"),
		purpose: z.string().min(1, "Mission Script Purpose required"),
		path: z.string().min(1, "Path is required"),
		root: z.enum(SymbolicLinkDestRoot),
		runOn: z.enum(MissionScriptRunOn),
	})
	.meta({
		ref: "ModReleaseMissionScriptData",
		title: "Mod Release Mission Script Data",
		description: "Data representation of a mission script configuration.",
	});

export type ModReleaseMissionScriptData = z.infer<typeof ModReleaseMissionScriptData>;

// ModRelease schema
export const ModReleaseData = z
	.object({
		id: z.string(),
		modId: z.string(),
		version: z.string(),
		versionHash: z.string(),
		changelog: z.string(),
		assets: z.array(ModReleaseAssetData),
		symbolicLinks: z.array(ModReleaseSymbolicLinkData),
		missionScripts: z.array(ModReleaseMissionScriptData),
		visibility: z.enum(ModVisibility),
		downloadsCount: z.number().default(0),
		createdAt: z.coerce.string().optional(),
		updatedAt: z.coerce.string().optional(),
	})
	.meta({
		ref: "ModReleaseData",
		title: "Mod Release Data",
		description: "Data representation of a mod release.",
	});

export type ModReleaseData = z.infer<typeof ModReleaseData>;

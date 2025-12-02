import { z } from "zod";
import {
	AssetStatus,
	DownloadedReleaseStatus,
	MissionScriptRunOn,
	SymbolicLinkDestRoot,
} from "../../common/data.ts";

export const ModReleaseAssetStatusData = z
	.object({
		downloadPercentProgress: z.number().optional(),
		extractPercentProgress: z.number().optional(),
		overallPercentProgress: z.number().optional(),
		status: z.enum(AssetStatus),
	})
	.meta({
		ref: "ModReleaseAssetStatusData",
		title: "Mod Release Asset Status Data",
		description:
			"Status data representation of a mod release asset, including download and extraction progress.",
	});

export type ModReleaseAssetStatusData = z.infer<
	typeof ModReleaseAssetStatusData
>;

// Asset schema
export const ModReleaseAssetData = z
	.object({
		name: z.string().min(1, "Asset name is required"),
		urls: z.string().url().array(),
		isArchive: z.boolean(),
		statusData: ModReleaseAssetStatusData.optional(),
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

export type ModReleaseSymbolicLinkData = z.infer<
	typeof ModReleaseSymbolicLinkData
>;

// Mission script schema
export const ModReleaseMissionScriptData = z
	.object({
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

export type ModReleaseMissionScriptData = z.infer<
	typeof ModReleaseMissionScriptData
>;

// ModRelease schema
export const ModAndReleaseData = z
	.object({
		releaseId: z.string(),
		modId: z.string(),
		modName: z.string(),
		dependencies: z.array(z.string()),
		version: z.string(),
		assets: z.array(ModReleaseAssetData),
		symbolicLinks: z.array(ModReleaseSymbolicLinkData),
		missionScripts: z.array(ModReleaseMissionScriptData),
		status: z.enum(DownloadedReleaseStatus).optional(),
		overallPercentProgress: z.number().optional(),
	})
	.meta({
		ref: "ModAndReleaseData",
		title: "Mod and Release Data",
		description:
			"Data representation of a mod along with its release for downloading and enabling.",
	});

export type ModAndReleaseData = z.infer<typeof ModAndReleaseData>;

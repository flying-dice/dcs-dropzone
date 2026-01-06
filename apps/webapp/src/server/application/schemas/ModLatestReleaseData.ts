import type { z } from "zod";
import { ModReleaseData } from "./ModReleaseData.ts";

export const ModLatestReleaseData = ModReleaseData.pick({
	id: true,
	modId: true,
	version: true,
	createdAt: true,
}).meta({
	ref: "ModLatestReleaseData",
	title: "Mod Latest Release Data",
	description: "Data representation of the latest release of a mod.",
});

export type ModLatestReleaseData = z.infer<typeof ModLatestReleaseData>;

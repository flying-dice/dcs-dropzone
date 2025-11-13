import type { z } from "zod";
import { ModReleaseData } from "./ModReleaseData.ts";

export const ModReleaseCreateData = ModReleaseData.pick({
	version: true,
}).meta({
	ref: "ModReleaseCreateData",
	title: "Mod Release Create Data",
	description: "Data required to create a new mod release.",
});

export type ModReleaseCreateData = z.infer<typeof ModReleaseCreateData>;

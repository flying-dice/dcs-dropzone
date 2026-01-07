import type { z } from "zod";
import { ModReleaseData } from "./ModReleaseData.ts";

export const ModReleaseUpdateData = ModReleaseData.omit({
	versionHash: true,
}).meta({
	ref: "ModReleaseUpdateData",
	title: "Mod Release Update Data",
	description: "Data required to update an existing mod release.",
});
export type ModReleaseUpdateData = z.infer<typeof ModReleaseUpdateData>;

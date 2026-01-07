import type { z } from "zod";
import { ModData } from "./ModData.ts";

export const ModUpdateData = ModData.omit({
	downloadsCount: true,
}).meta({
	ref: "ModUpdateData",
	title: "Mod Update Data",
	description: "Data required to update an existing mod.",
});
export type ModUpdateData = z.infer<typeof ModUpdateData>;

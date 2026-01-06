import type { z } from "zod";
import { ModData } from "./ModData.ts";

export const ModUpdateData = ModData.pick({
	name: true,
	category: true,
	description: true,
	content: true,
	tags: true,
	maintainers: true,
	thumbnail: true,
	screenshots: true,
	dependencies: true,
	visibility: true,
	latestReleaseId: true,
}).meta({
	ref: "ModUpdateData",
	title: "Mod Update Data",
	description: "Data required to create a new mod.",
});
export type ModUpdateData = z.infer<typeof ModUpdateData>;

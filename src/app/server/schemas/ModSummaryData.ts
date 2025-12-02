import type { z } from "zod";
import { ModData } from "./ModData.ts";

export const ModSummaryData = ModData.pick({
	id: true,
	name: true,
	category: true,
	description: true,
	thumbnail: true,
	dependencies: true,
	maintainers: true,
	tags: true,
	downloadsCount: true,
	averageRating: true,
	ratingsCount: true,
}).meta({
	ref: "ModSummaryData",
	title: "Mod Summary Data",
	description: "Summary Data representation of a mod.",
});

export type ModSummaryData = z.infer<typeof ModSummaryData>;

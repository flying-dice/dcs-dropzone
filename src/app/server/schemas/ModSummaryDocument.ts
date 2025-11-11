import type { z } from "zod";
import { ModDocument } from "./ModDocument.ts";

export const ModSummaryDocument = ModDocument.pick({
	id: true,
	name: true,
	category: true,
	description: true,
	thumbnail: true,
	maintainers: true,
	tags: true,
}).meta({
	title: "Mod Summary Document",
	description: "Database document representation of a mod summary.",
});

export type ModSummaryDocument = z.infer<typeof ModSummaryDocument>;

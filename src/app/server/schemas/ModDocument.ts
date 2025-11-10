import { z } from "zod";
import { ModCategory, ModVisibility } from "../../../common/data.ts";

export const ModDocument = z
	.object({
		id: z.string(),
		name: z.string(),
		category: z.enum(ModCategory),
		description: z.string(),
		content: z.string(),
		tags: z.array(z.string()),
		dependencies: z.array(z.string()),
		screenshots: z.array(z.string()),
		thumbnail: z.string(),
		visibility: z.enum(ModVisibility),
		maintainers: z.array(z.string()),
		createdAt: z.date().optional(),
		updatedAt: z.date().optional(),
	})
	.meta({
		title: "Mod Document",
		description: "Database document representation of a mod.",
	});

export type ModDocument = z.infer<typeof ModDocument>;

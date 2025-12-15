import { ze } from "@packages/zod";
import { z } from "zod";
import { ModCategory } from "../enums/ModCategory.ts";
import { ModVisibility } from "../enums/ModVisibility.ts";

export const ModData = z
	.object({
		id: z.string(),
		name: z.string(),
		category: z.enum(ModCategory),
		description: z.string(),
		content: z.string(),
		tags: ze.tag().array(),
		dependencies: z.string().array(),
		screenshots: z.string().array(),
		thumbnail: z.string(),
		visibility: z.enum(ModVisibility),
		maintainers: z.array(z.string()).min(1, "A mod must have at least one maintainer."),
		latestReleaseId: z.string().nullable().optional(),
		downloadsCount: z.number(),
	})
	.meta({
		ref: "ModData",
		title: "Mod Data",
		description: "Data representation of a mod.",
	});

export type ModData = z.infer<typeof ModData>;

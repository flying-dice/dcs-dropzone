import { zKebabCaseString } from "common/zod";
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
		tags: zKebabCaseString.array(),
		dependencies: z.array(z.string()),
		screenshots: z.array(z.string()),
		thumbnail: z.string(),
		visibility: z.enum(ModVisibility),
		maintainers: z.array(z.string()).min(1, "A mod must have at least one maintainer."),
		downloadsCount: z.number(),
	})
	.meta({
		ref: "ModData",
		title: "Mod Data",
		description: "Data representation of a mod.",
	});

export type ModData = z.infer<typeof ModData>;

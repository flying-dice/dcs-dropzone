import { ze } from "@packages/zod/ze";
import { z } from "zod";
import { ModCategory } from "../enums/ModCategory.ts";
import { ModVisibility } from "../enums/ModVisibility.ts";

export const ModData = z
	.object({
		category: z.enum(ModCategory),
		content: z.string(),
		dependencies: z.string().array(),
		description: z.string(),
		downloadsCount: z.number(),
		id: z.string(),
		latestReleaseId: z.string().nullable().optional(),
		maintainers: z.array(z.string()).min(1, "A mod must have at least one maintainer."),
		name: z.string(),
		screenshots: z.string().array(),
		tags: ze.tag().array(),
		thumbnail: z.string(),
		visibility: z.enum(ModVisibility),
	})
	.meta({
		ref: "ModData",
		title: "Mod Data",
		description: "Data representation of a mod.",
	});

export type ModData = z.infer<typeof ModData>;

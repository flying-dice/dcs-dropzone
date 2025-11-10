import { z } from "zod";
import { ModCategory, ModVisibility } from "../../../common/data.ts";

export const ModData = z.object({
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
	maintainers: z
		.array(z.string())
		.min(1, "A mod must have at least one maintainer."),
});

export type ModData = z.infer<typeof ModData>;

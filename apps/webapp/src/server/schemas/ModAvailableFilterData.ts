import { z } from "zod";
import { ModData } from "./ModData.ts";
import { UserData } from "./UserData.ts";

export const ModAvailableFilterData = z
	.object({
		categories: ModData.shape.category.array(),
		maintainers: UserData.pick({
			id: true,
			username: true,
		}).array(),
		tags: ModData.shape.tags,
	})
	.meta({
		ref: "ModAvailableFilterData",
		title: "Mod Available Filter Data",
		description: "Data structure for filtering mods.",
	});

export type ModAvailableFilterData = z.infer<typeof ModAvailableFilterData>;

import type { z } from "zod";
import { ModData } from "./ModData.ts";

export const ModCreateData = ModData.pick({
	name: true,
	category: true,
	description: true,
}).meta({
	ref: "ModCreateData",
	title: "Mod Create Data",
	description: "Data required to create a new mod.",
});
export type ModCreateData = z.infer<typeof ModCreateData>;

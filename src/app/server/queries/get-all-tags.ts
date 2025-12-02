import { z } from "zod";
import { ModVisibility } from "../../../common/data.ts";
import { Mod } from "../entities/Mod.ts";

const InputSchema = z.object({});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {}

export default async function (input: Input, deps: Deps): Promise<string[]> {
	const tags = await Mod.distinct("tags", {
		visibility: ModVisibility.PUBLIC,
	}).exec();

	return tags.sort();
}

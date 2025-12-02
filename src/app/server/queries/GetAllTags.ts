import { ModVisibility } from "../../../common/data.ts";
import { Mod } from "../entities/Mod.ts";

export async function getAllTags() {
	const tags = await Mod.distinct("tags", {
		visibility: ModVisibility.PUBLIC,
	}).exec();

	return tags.sort();
}

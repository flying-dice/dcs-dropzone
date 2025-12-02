import { ModVisibility } from "../../../common/data.ts";
import { Mod } from "../entities/Mod.ts";

type GetAllTagsResult = string[];

export default async function (): Promise<GetAllTagsResult> {
	const tags = await Mod.distinct("tags", {
		visibility: ModVisibility.PUBLIC,
	}).exec();

	return tags.sort();
}

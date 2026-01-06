import { ModVisibility } from "../enums/ModVisibility.ts";
import { Mod } from "../mongo-db/entities/Mod.ts";

type GetAllTagsResult = string[];

export default async function (): Promise<GetAllTagsResult> {
	const tags = await Mod.distinct("tags", {
		visibility: ModVisibility.PUBLIC,
	}).exec();

	return tags.sort();
}

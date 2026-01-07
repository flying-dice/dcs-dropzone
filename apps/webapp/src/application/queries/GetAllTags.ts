import { Mod } from "../../database/entities/Mod.ts";
import { ModVisibility } from "../enums/ModVisibility.ts";

type GetAllTagsResult = string[];

export default async function (): Promise<GetAllTagsResult> {
	const tags = await Mod.distinct("tags", {
		visibility: ModVisibility.PUBLIC,
	}).exec();

	return tags.sort();
}

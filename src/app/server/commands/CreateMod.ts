import { getLogger } from "log4js";
import { ModVisibility } from "../../../common/data.ts";
import { Mod } from "../entities/Mod.ts";
import type { ModCreateData } from "../schemas/ModCreateData.ts";
import { ModData } from "../schemas/ModData.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("CreateMod");

export type CreateModCommand = {
	user: UserData;
	createData: ModCreateData;
};

export default async function ({
	user,
	createData,
}: CreateModCommand): Promise<ModData> {
	logger.debug({ userId: user.id, createData }, "start");
	const id = crypto.randomUUID();

	const modData: ModData = {
		id,
		name: createData.name,
		category: createData.category,
		description: createData.description,
		thumbnail: "https://cdn-icons-png.flaticon.com/512/10446/10446694.png",
		screenshots: [],
		content: "Add your mod content here.",
		tags: [],
		dependencies: [],
		visibility: ModVisibility.PRIVATE,
		maintainers: [user.id],
		averageRating: 0,
		ratingsCount: 0,
		downloadsCount: 0,
	};

	const result = await Mod.create(ModData.parse(modData));
	logger.debug({ modId: id }, "User successfully created mod");

	return ModData.parse(result);
}

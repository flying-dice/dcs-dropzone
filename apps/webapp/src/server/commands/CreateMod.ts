import { getLogger } from "log4js";
import { Mod } from "../infrastructure/mongo-db/entities/Mod.ts";
import { ModVisibility } from "../application/enums/ModVisibility.ts";
import type { ModCreateData } from "../application/schemas/ModCreateData.ts";
import { ModData } from "../application/schemas/ModData.ts";
import type { UserData } from "../application/schemas/UserData.ts";

export type CreateModCommand = {
	user: UserData;
	createData: ModCreateData;
};

export type CreateModResult = ModData;

const logger = getLogger("CreateMod");

export default async function (command: CreateModCommand): Promise<CreateModResult> {
	const { user, createData } = command;
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
		downloadsCount: 0,
	};

	const result = await Mod.create(ModData.parse(modData));
	logger.debug({ modId: id }, "User successfully created mod");

	return ModData.parse(result);
}

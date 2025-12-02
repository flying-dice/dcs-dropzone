import { getLogger } from "log4js";
import { z } from "zod";
import { ModVisibility } from "../../../common/data.ts";
import { Mod } from "../entities/Mod.ts";
import { ModCreateData } from "../schemas/ModCreateData.ts";
import { ModData } from "../schemas/ModData.ts";

const logger = getLogger("commands/create-mod");

const InputSchema = z.object({
	userId: z.string(),
	data: ModCreateData,
});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	generateId: () => string;
}

export default async function (input: Input, deps: Deps): Promise<ModData> {
	logger.debug({ userId: input.userId, createData: input.data }, "createMod start");
	const id = deps.generateId();

	const modData: ModData = {
		id,
		name: input.data.name,
		category: input.data.category,
		description: input.data.description,
		thumbnail: "https://cdn-icons-png.flaticon.com/512/10446/10446694.png",
		screenshots: [],
		content: "Add your mod content here.",
		tags: [],
		dependencies: [],
		visibility: ModVisibility.PRIVATE,
		maintainers: [input.userId],
		averageRating: 0,
		ratingsCount: 0,
		downloadsCount: 0,
	};

	const result = await Mod.create(ModData.parse(modData));
	logger.debug({ modId: id }, "User successfully created mod");

	return ModData.parse(result);
}

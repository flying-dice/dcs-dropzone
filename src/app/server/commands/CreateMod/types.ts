import type { ModCreateData } from "../../schemas/ModCreateData.ts";
import type { ModData } from "../../schemas/ModData.ts";
import type { UserData } from "../../schemas/UserData.ts";

export type Command = {
	user: UserData;
	createData: ModCreateData;
};

export type CommandResult = ModData;

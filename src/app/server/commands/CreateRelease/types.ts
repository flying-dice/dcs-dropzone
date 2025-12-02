import type { Result } from "neverthrow";
import type { ModReleaseCreateData } from "../../schemas/ModReleaseCreateData.ts";
import type { ModReleaseData } from "../../schemas/ModReleaseData.ts";
import type { UserData } from "../../schemas/UserData.ts";

export type Command = {
	user: UserData;
	modId: string;
	createData: ModReleaseCreateData;
};

export type CommandResult = Result<ModReleaseData, "NotFound">;

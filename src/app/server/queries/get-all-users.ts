import { getLogger } from "log4js";
import { z } from "zod";
import { User } from "../entities/User.ts";
import { UserData } from "../schemas/UserData.ts";

const logger = getLogger("queries/get-all-users");

const InputSchema = z.object({});
export type Input = z.infer<typeof InputSchema>;

export interface Deps {
	orm: typeof User;
}

export default async function (input: Input, deps: Deps): Promise<UserData[]> {
	logger.debug("getAllUsers start");
	const users = await deps.orm.find().lean().exec();
	logger.debug(`getAllUsers found ${users.length} users`);
	return UserData.array().parse(users);
}

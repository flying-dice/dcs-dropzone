import { Log } from "@packages/decorators";
import { getLogger } from "log4js";
import type { UserRepository } from "../application/ports/UserRepository.ts";
import type { UserData } from "../application/schemas/UserData.ts";
import { UserData as UserDataSchema } from "../application/schemas/UserData.ts";
import { User } from "../database/entities/User.ts";

const logger = getLogger("MongoUserRepository");
/**
 * MongoDB implementation of the UserRepository port using Mongoose.
 */
export class MongoUserRepository implements UserRepository {
	@Log(logger)
	async findById(userId: string): Promise<UserData | undefined> {
		const doc = await User.findOne({ id: userId }).lean().exec();
		if (!doc) {
			return undefined;
		}
		return UserDataSchema.parse(doc);
	}

	@Log(logger)
	async findAllByIds(userIds: string[]): Promise<UserData[]> {
		const docs = await User.find({ id: { $in: userIds } })
			.lean()
			.exec();
		return docs.map((doc) => UserDataSchema.parse(doc));
	}

	@Log(logger)
	async saveUserDetails(userDetails: UserData): Promise<UserData> {
		const doc = await User.findOneAndUpdate({ id: userDetails.id }, userDetails, {
			upsert: true,
			new: true,
		})
			.lean()
			.exec();
		return UserDataSchema.parse(doc);
	}
}

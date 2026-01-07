import type { UserRepository } from "../application/ports/UserRepository.ts";
import type { UserData } from "../application/schemas/UserData.ts";
import { UserData as UserDataSchema } from "../application/schemas/UserData.ts";
import { User } from "../database/entities/User.ts";

/**
 * MongoDB implementation of the UserRepository port using Mongoose.
 */
export class MongoUserRepository implements UserRepository {
	async findById(userId: string): Promise<UserData | undefined> {
		const doc = await User.findOne({ id: userId }).lean().exec();
		if (!doc) {
			return undefined;
		}
		return UserDataSchema.parse(doc);
	}

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

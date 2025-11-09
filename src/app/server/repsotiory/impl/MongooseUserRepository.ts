import mongoose, { type InferSchemaType } from "mongoose";
import { User } from "../../domain/User.ts";
import type { UserRepository } from "../UserRepository.ts";

export const _Schema = new mongoose.Schema(
	{
		id: { type: String, required: true, unique: true },
		login: { type: String, required: true, unique: true },
		name: { type: String, required: false },
		profileUrl: { type: String, required: true },
		avatarUrl: { type: String, required: true },
	},
	{ timestamps: true },
);

export type _Document = InferSchemaType<typeof _Schema>;

export const _Model = mongoose.model("User", _Schema);

export class MongooseUserRepository implements UserRepository {
	async getById(id: string): Promise<User | undefined> {
		const document = await _Model.findOne({ id }).exec();

		if (!document) {
			return undefined;
		}

		return this.fromDocument(document);
	}

	async getByIdOrThrow(id: string): Promise<User> {
		const user = await this.getById(id);
		if (!user) {
			throw new Error(`User with id ${id} not found`);
		}
		return user;
	}

	async save(user: User): Promise<void> {
		const doc = this.toDocument(user);
		await _Model
			.findOneAndUpdate(
				{ id: user.userId },
				{
					login: doc.login,
					name: doc.name,
					profileUrl: doc.profileUrl,
					avatarUrl: doc.avatarUrl,
				},
				{
					new: true,
					upsert: true,
				},
			)
			.exec();
	}

	async delete(id: string): Promise<void> {
		await _Model.findByIdAndDelete(id).exec();
	}

	protected fromDocument(document: _Document): User {
		return new User({
			userId: document.id,
			userLogin: document.login,
			userName: document.name ?? undefined,
			userProfileUrl: document.profileUrl,
			userAvatarUrl: document.avatarUrl,
		});
	}

	protected toDocument(user: User): _Document {
		return new _Model({
			id: user.userId,
			login: user.userLogin,
			name: user.userName,
			profileUrl: user.userProfileUrl,
			avatarUrl: user.userAvatarUrl,
		});
	}
}

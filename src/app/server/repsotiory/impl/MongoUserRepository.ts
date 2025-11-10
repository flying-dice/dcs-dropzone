import type { Db } from "mongodb";
import { User } from "../../domain/User.ts";
import { UserDocument } from "../../schemas/UserDocument.ts";
import type { UserRepository } from "../UserRepository.ts";
import { MongoRepository } from "./MongoRepository.ts";

export class MongoUserRepository
	extends MongoRepository<User, UserDocument>
	implements UserRepository
{
	constructor(db: Db) {
		super(db, "users");
	}

	async postConstruct(): Promise<void> {
		await this.col.createIndex({ id: 1 }, { unique: true });
		await this.col.createIndex({ username: 1 }, { unique: true });
	}

	protected toDomain(document: UserDocument): User {
		return new User({
			id: document.id,
			username: document.username,
			name: document.name ?? undefined,
			profileUrl: document.profileUrl,
			avatarUrl: document.avatarUrl,
		});
	}

	protected toDocument(domain: User): UserDocument {
		const s = domain.toData();
		return UserDocument.parse({
			id: s.id,
			username: s.username,
			name: s.name ?? null,
			profileUrl: s.profileUrl,
			avatarUrl: s.avatarUrl,
		});
	}
}

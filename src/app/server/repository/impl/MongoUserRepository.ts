import type { Db } from "mongodb";
import { User } from "../../domain/User.ts";
import Logger from "../../Logger.ts";
import { UserDocument } from "../../schemas/UserDocument.ts";
import type { UserRepository } from "../UserRepository.ts";
import { MongoRepository } from "./MongoRepository.ts";

const logger = Logger.getLogger("MongoUserRepository");

export class MongoUserRepository
	extends MongoRepository<User, UserDocument>
	implements UserRepository
{
	constructor(db: Db) {
		super(logger, db, "users");
	}

	async postConstruct(): Promise<void> {
		logger.debug("Ensuring indexes for 'users' collection");
		await this.col.createIndex({ id: 1 }, { unique: true });
		await this.col.createIndex({ username: 1 }, { unique: true });
		logger.debug("Indexes ensured for 'users'");
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

import { MongooseModRepository } from "./impl/MongooseModRepository.ts";
import { MongooseUserRepository } from "./impl/MongooseUserRepository.ts";
import type { ModRepository } from "./ModRepository.ts";
import type { UserRepository } from "./UserRepository.ts";

export const userRepository: UserRepository = new MongooseUserRepository();
export const modRepository: ModRepository = new MongooseModRepository(
	userRepository,
);

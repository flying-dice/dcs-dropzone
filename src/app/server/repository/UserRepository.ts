import type { User } from "../domain/User.ts";
import type { Repository } from "./Repository.ts";

/**
 * Interface representing a repository for managing `User` entities.
 */
export interface UserRepository extends Repository<User> {}

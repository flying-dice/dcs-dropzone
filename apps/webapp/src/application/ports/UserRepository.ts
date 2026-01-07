import type { UserData } from "../schemas/UserData.ts";

export interface UserRepository {
	findById(userId: string): Promise<UserData | undefined>;
	findAllByIds(userIds: string[]): Promise<UserData[]>;
	saveUserDetails(userDetails: UserData): Promise<UserData>;
}

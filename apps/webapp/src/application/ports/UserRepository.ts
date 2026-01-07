import type { UserData } from "../schemas/UserData.ts";

export interface UserRepository {
	findById(userId: string): Promise<UserData | undefined>;
	saveUserDetails(userDetails: UserData): Promise<UserData>;
}

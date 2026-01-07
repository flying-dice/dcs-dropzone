import type { UserRepository } from "../application/ports/UserRepository.ts";
import type { UserData } from "../application/schemas/UserData.ts";

/**
 * In-memory test double for UserRepository port.
 */
export class TestUserRepository implements UserRepository {
	private users = new Map<string, UserData>();

	async findById(userId: string): Promise<UserData | undefined> {
		return this.users.get(userId);
	}

	async saveUserDetails(userDetails: UserData): Promise<UserData> {
		this.users.set(userDetails.id, userDetails);
		return userDetails;
	}

	async findAllByIds(userIds: string[]): Promise<UserData[]> {
		const foundUsers: UserData[] = [];
		for (const userId of userIds) {
			const user = this.users.get(userId);
			if (user) {
				foundUsers.push(user);
			}
		}
		return foundUsers;
	}
}

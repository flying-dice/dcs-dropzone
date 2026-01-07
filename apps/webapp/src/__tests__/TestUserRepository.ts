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

	// Test helper methods
	getAllUsers(): UserData[] {
		return Array.from(this.users.values());
	}

	clear(): void {
		this.users.clear();
	}
}

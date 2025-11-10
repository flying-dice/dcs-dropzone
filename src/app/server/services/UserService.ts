import { User } from "../domain/User.ts";
import { UserToken } from "../domain/UserToken.ts";
import type { UserRepository } from "../repsotiory/UserRepository.ts";
import type { UserData } from "../schemas/UserData.ts";
import type { AuthResult } from "./AuthService.ts";

export class UserService {
	constructor(protected userRepository: UserRepository) {}

	async getUserById(userId: string): Promise<UserData> {
		const user = await this.userRepository.getById(userId);
		if (!user) {
			throw new Error("User not found");
		}

		return user.toData();
	}

	async issueTokenForAuthResult(authResult: AuthResult): Promise<string> {
		const user = new User({
			id: authResult.id,
			name: authResult.name,
			username: authResult.username,
			avatarUrl: authResult.avatarUrl,
			profileUrl: authResult.profileUrl,
		});

		await this.userRepository.save(user);

		return new UserToken({ userId: user.id }).toTokenString();
	}
}

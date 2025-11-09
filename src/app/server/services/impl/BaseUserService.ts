import { User } from "../../domain/User.ts";
import { UserToken } from "../../domain/UserToken.ts";
import type { UserDto } from "../../dto/UserDto.ts";
import type { UserRepository } from "../../repsotiory/UserRepository.ts";
import type { AuthResult } from "../AuthService.ts";
import type { UserService } from "../UserService.ts";

export class BaseUserService implements UserService {
	constructor(protected userRepository: UserRepository) {}

	async getUserById(userId: string): Promise<UserDto> {
		const user = await this.userRepository.getById(userId);
		if (!user) {
			throw new Error("User not found");
		}

		return {
			id: user.userId,
			name: user.userName,
			login: user.userLogin,
			avatarUrl: user.userAvatarUrl,
			profileUrl: user.userProfileUrl,
		};
	}

	async issueTokenForAuthResult(authResult: AuthResult): Promise<string> {
		const user = new User({
			userId: authResult.id,
			userName: authResult.name,
			userLogin: authResult.username,
			userAvatarUrl: authResult.avatarUrl,
			userProfileUrl: authResult.profileUrl,
		});

		await this.userRepository.save(user);

		return new UserToken(user.userId).toTokenString();
	}
}

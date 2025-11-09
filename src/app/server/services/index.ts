import type { UserDto } from "../dto/UserDto.ts";
import { modRepository, userRepository } from "../repsotiory";
import type { AuthService } from "./AuthService.ts";
import { GithubAuthService } from "./GithubAuthService.ts";
import { UserModService } from "./UserModService.ts";
import { UserService } from "./UserService.ts";

export enum AuthServiceProvider {
	GITHUB = "github",
}

export function getAuthService(provider: AuthServiceProvider): AuthService {
	switch (provider) {
		case AuthServiceProvider.GITHUB:
			return new GithubAuthService();
		default:
			throw new Error(`Unsupported auth service provider: ${provider}`);
	}
}

export function getUserModService(user: UserDto): UserModService {
	return new UserModService(modRepository, userRepository, user);
}

export const userService: UserService = new UserService(userRepository);

import type { UserDto } from "../dto/UserDto.ts";
import type { AuthResult } from "./AuthService.ts";

export interface UserService {
	getUserById(userId: string): Promise<UserDto>;

	issueTokenForAuthResult(authResult: AuthResult): Promise<string>;
}

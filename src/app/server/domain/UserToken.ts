import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import appConfig from "../app-config.ts";
import type { User } from "./User.ts";

const ENC_JWT_SECRET: Uint8Array<ArrayBufferLike> = new TextEncoder().encode(
	appConfig.jwtSecret,
);

/**
 * Zod schema for validating the structure of a user token payload.
 */
const USER_TOKEN_SCHEMA = z.object({
	userId: z.string(),
});

/**
 * Class representing a user token for authentication and authorization purposes.
 */
export class UserToken {
	/**
	 * Creates an instance of UserToken.
	 * @param {string} userId - The unique identifier of the user.
	 */
	constructor(public readonly userId: string) {}

	/**
	 * Converts the UserToken instance into a signed JWT string.
	 * @returns {Promise<string>} A promise that resolves to the signed JWT string.
	 * @throws {Error} If the token payload validation fails or signing fails.
	 */
	async toTokenString(): Promise<string> {
		const tokenPayload = USER_TOKEN_SCHEMA.parse({
			userId: this.userId,
		});

		return await new SignJWT(tokenPayload)
			.setProtectedHeader({ alg: "HS256" })
			.setIssuedAt()
			.setExpirationTime("15m")
			.sign(ENC_JWT_SECRET);
	}

	/**
	 * Creates a UserToken instance from a signed JWT string.
	 * @param {string} tokenString - The signed JWT string.
	 * @returns {Promise<UserToken>} A promise that resolves to a UserToken instance.
	 * @throws {Error} If the token verification or payload validation fails.
	 */
	static async fromTokenString(tokenString: string): Promise<UserToken> {
		const verifiedToken = await jwtVerify<User>(tokenString, ENC_JWT_SECRET);

		const { userId } = USER_TOKEN_SCHEMA.parse(verifiedToken.payload);

		return new UserToken(userId);
	}
}

import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import appConfig from "../app-config.ts";
import type { User } from "./User.ts";

const ENC_JWT_SECRET: Uint8Array<ArrayBufferLike> = new TextEncoder().encode(
	appConfig.jwtSecret,
);

const USER_TOKEN_SCHEMA = z.object({
	userId: z.string(),
});

export class UserToken {
	constructor(public readonly userId: string) {}

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

	static async fromTokenString(tokenString: string): Promise<UserToken> {
		const verifiedToken = await jwtVerify<User>(tokenString, ENC_JWT_SECRET);

		const { userId } = USER_TOKEN_SCHEMA.parse(verifiedToken.payload);

		return new UserToken(userId);
	}
}

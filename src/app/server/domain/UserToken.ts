import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import appConfig from "../ApplicationConfig.ts";
import { DomainObject } from "./DomainObject.ts";

const ENC_JWT_SECRET: Uint8Array<ArrayBufferLike> = new TextEncoder().encode(
	appConfig.jwtSecret,
);

export const UserTokenData = z.object({
	userId: z.string(),
});

export type UserTokenData = z.infer<typeof UserTokenData>;

export class UserToken extends DomainObject<typeof UserTokenData> {
	constructor(data: UserTokenData) {
		super(UserTokenData, data);
	}

	get userId(): string {
		return this.data.userId;
	}

	async toTokenString(): Promise<string> {
		return await new SignJWT(this.data)
			.setProtectedHeader({ alg: "HS256" })
			.setIssuedAt()
			.setExpirationTime("15m")
			.sign(ENC_JWT_SECRET);
	}

	static async fromTokenString(tokenString: string): Promise<UserToken> {
		const verifiedToken = await jwtVerify<UserTokenData>(
			tokenString,
			ENC_JWT_SECRET,
		);

		return new UserToken(verifiedToken.payload);
	}
}

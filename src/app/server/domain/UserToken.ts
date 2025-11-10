import { jwtVerify, SignJWT } from "jose";
import appConfig from "../ApplicationConfig.ts";
import Logger from "../Logger.ts";
import { UserTokenData } from "../schemas/UserTokenData.ts";
import { DomainObject } from "./DomainObject.ts";

const logger = Logger.getLogger("UserToken");

const ENC_JWT_SECRET: Uint8Array<ArrayBufferLike> = new TextEncoder().encode(
	appConfig.jwtSecret,
);

export class UserToken extends DomainObject<typeof UserTokenData> {
	constructor(data: UserTokenData) {
		super(UserTokenData, data);
	}

	get userId(): string {
		return this.data.userId;
	}

	async toTokenString(): Promise<string> {
		logger.debug({ userId: this.data.userId }, "Signing user token");
		return await new SignJWT(this.data)
			.setProtectedHeader({ alg: "HS256" })
			.setIssuedAt()
			.setExpirationTime("15m")
			.sign(ENC_JWT_SECRET);
	}

	/**
	 * Creates a UserToken instance from a JWT token string.
	 *
	 * @param tokenString - The JWT token string to verify and decode.
	 * @returns A Promise that resolves to a UserToken instance.
	 * @throws An error if the token is invalid or verification fails.
	 */
	static async fromTokenString(tokenString: string): Promise<UserToken> {
		logger.debug("Verifying user token");
		const verifiedToken = await jwtVerify<UserTokenData>(
			tokenString,
			ENC_JWT_SECRET,
		);
		logger.debug(
			{ userId: verifiedToken.payload.userId },
			"User token verified",
		);
		return new UserToken(verifiedToken.payload);
	}
}

import { jwtVerify, SignJWT } from "jose";
import appConfig from "../ApplicationConfig.ts";
import Logger from "../Logger.ts";
import { UserTokenData } from "../schemas/UserTokenData.ts";

const ENC_JWT_SECRET: Uint8Array<ArrayBufferLike> = new TextEncoder().encode(
	appConfig.jwtSecret,
);

const logger = Logger.getLogger("UserTokenService");

export class UserTokenService {
	async issueTokenString(userId: string): Promise<string> {
		logger.debug({ userId }, "Signing user token");
		const payload: UserTokenData = { userId };

		return await new SignJWT(UserTokenData.parse(payload))
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
	async parseTokenString(tokenString: string): Promise<UserTokenData> {
		logger.debug("Verifying user token");
		const verifiedToken = await jwtVerify<UserTokenData>(
			tokenString,
			ENC_JWT_SECRET,
		);
		logger.debug(
			{ userId: verifiedToken.payload.userId },
			"User token verified",
		);
		return UserTokenData.parse(verifiedToken.payload);
	}
}

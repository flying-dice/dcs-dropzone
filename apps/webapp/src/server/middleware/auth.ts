import appConfig from "../ApplicationConfig.ts";
import { cookieAuth } from "./cookieAuth.ts";
import { mockAuth } from "./mockAuth.ts";

/**
 * Authentication middleware that selects between real cookie-based auth
 * and mock auth based on configuration.
 *
 * When AUTH_DISABLED=true, uses mock auth with a fake user.
 * Otherwise, uses standard cookie-based authentication.
 */
export const auth = () => {
	if (appConfig.authDisabled) {
		return mockAuth();
	}
	// cookieAuth is used when authentication is enabled (real OAuth flow)
	return cookieAuth();
};

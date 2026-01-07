/**
 * Represents the result of an authentication process.
 */
export type AuthResult = {
	/** The unique identifier of the authenticated user. */
	id: string;
	/** The username of the authenticated user. */
	username: string;
	/** The name of the authenticated user (optional). */
	name?: string;
	/** The URL of the user's avatar image. */
	avatarUrl: string;
	/** The URL of the user's profile. */
	profileUrl: string;
};

/**
 * Interface defining the authentication service.
 */
export interface AuthenticationProvider {
	/**
	 * Generates and returns the URL for initiating the web flow authorization process.
	 * @returns {string} The authorization URL.
	 */
	getWebFlowAuthorizationUrl(): string;

	/**
	 * Handles the callback from the authorization process.
	 *
	 * @param {string} code - The authorization code received from the callback.
	 * @param {string} state - The state parameter to validate the callback.
	 * @returns {Promise<AuthResult>} A promise that resolves to the authentication result.
	 */
	handleCallback(code: string, state: string): Promise<AuthResult>;
}

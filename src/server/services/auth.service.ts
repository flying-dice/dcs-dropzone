import { z } from "zod";

/**
 * The UserData contains the information about the authenticated user.
 * This information is used to identify the user and display their profile picture and name in the application.
 */
export type UserData = {
  /**
   * The userId is a unique identifier for the user in the application, primarily used to identify the user in the database by adding this ID to the list of mod maintainers.
   * Only tokens bearing this userId should be able to amend the mod by checking the maintainer list on the mod.
   */
  userId: string;

  /**
   * The userLogin is the username of the user on the provider's platform, this is used to display the user's username in the application.
   */
  userLogin: string;

  /**
   * The userName is the name of the user on the provider's platform, this is used to display the user's name in the application.
   */
  userName?: string;

  /**
   * The userAvatarUrl is the URL of the user's profile picture on the provider's platform, this is used to display the user's profile picture in the application.
   * The userAvatarUrl should be a direct link to the image file. This is used to display the user's profile picture in the application.
   */
  userAvatarUrl: string;

  /**
   * The userProfileUrl is the URL of the user's profile on the provider's platform, this is used to link to the user's profile on the provider's platform.
   */
  userProfileUrl: string;
};

export const userDataSchema = z.object({
  userId: z.string().nonempty(),
  userLogin: z.string().nonempty(),
  userName: z.string().optional(),
  userAvatarUrl: z.string().nonempty().url(),
  userProfileUrl: z.string().nonempty().url(),
});

export interface AuthService {
  /**
   * Called when the user visits the /auth/{provider}/login
   * The Webflow initiates the OAuth flow and redirects the user to the provider's login page.
   */
  getWebFlowAuthorizationUrl(): string;

  /**
   * Called when the user is redirected back to the application from the provider's login page.
   * The provider sends a code and a state parameter which are used to authenticate the user.
   */
  handleCallback(
    code: string,
    state: string,
  ): Promise<{ user: UserData; token: string }>;
}

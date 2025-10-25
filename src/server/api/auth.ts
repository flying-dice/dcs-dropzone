import {z} from "zod";
import {deleteCookie, setCookie} from "hono/cookie";
import {Hono} from "hono";
import {githubAuthService} from "../services/github-auth.service.ts";
import type {AuthService} from "../services/auth.service.ts";
import {describeRoute, resolver, validator} from "hono-openapi";
import appConfig from "../app-config.ts";
import {cookieAuth} from "../middleware/cookieAuth.ts";
import {StatusCodes} from "http-status-codes";

export const authenticatedUserSchema = z.object({
  id: z.string().describe(
    "The user's unique ID as a string, which is provided by the OAuth provider",
  ),
  name: z.string().optional().describe(
    "The user's name, if available. This is not always provided by the OAuth provider",
  ),
  login: z.string().describe(
    "The user's login, which is unique to the OAuth provider",
  ),
  avatarUrl: z.string().url().describe(
    "The user's avatar URL, which can be used to display the user's profile picture",
  ),
  profileUrl: z.string().url().describe(
    "The user's profile URL, which can be used to view the user's profile on the OAuth provider's website",
  ),
  sudo: z.boolean().describe("Whether the user is a sudo user"),
}).meta({
    ref: "AuthenticatedUser",
  description: "The currently authenticated user",
});

enum AuthServices {
  Github = "github",
}

const authServices: Record<AuthServices, AuthService> = {
  [AuthServices.Github]: githubAuthService,
};

const params = z.object({
  provider: z.enum(AuthServices)
});

const router = new Hono();

router.get(
  "/:provider/callback",
  describeRoute({
    summary: "OAuth provider callback",
    description:
      "Handles the OAuth provider's callback after the user has authenticated. The callback URL includes the user's access token and other information.",
    tags: ["Auth"],
  }),
  validator("param", params),
  validator("query", z.object({ code: z.string(), state: z.string() })),
  async (c) => {
    const provider = c.req.valid("param").provider;
    const authService = authServices[provider];

    const { token } = await authService.handleCallback(
      c.req.valid("query").code,
      c.req.valid("query").state,
    );

    setCookie(c, appConfig.sessionCookieName, token);

    return c.redirect(appConfig.ghHomepageUrl);
  },
);

router.get(
  "/:provider/login",
  describeRoute({
    summary: "Redirect to OAuth provider login page",
    description:
      "Redirects the user to the OAuth provider's authorization page (e.g., GitHub) to initiate the authentication process.",
    tags: ["Auth"],
  }),
  validator("param", params),
  (c) => {
    const provider = c.req.valid("param").provider;
    const authService = authServices[provider];

    return c.redirect(authService.getWebFlowAuthorizationUrl());
  },
);

router.get(
  "/user",
  describeRoute({
    summary: "Get authenticated user data",
    description:
      "Returns the details of the authenticated user, including their ID, login, avatar URL, and profile URL.\n Requires a valid authentication session (cookie-based authentication).",
    tags: ["Auth"],
    security: [{ cookieAuth: [] }],
    responses: {
      [StatusCodes.OK]: {
          description: "Authenticated user data",
          content: {
              "application/json": { schema: resolver(authenticatedUserSchema)}
          }
      },
    },
  }),
  cookieAuth(),
  (c) => {
    const user = c.var.getUser();
    return c.json(authenticatedUserSchema.parse({
      id: user.userId,
      name: user.userName,
      login: user.userLogin,
      avatarUrl: user.userAvatarUrl,
      profileUrl: user.userProfileUrl,
      sudo: appConfig.sudoUsers.includes(user.userId),
    }));
  },
);

router.get(
  "/logout",
  describeRoute({
    summary: "Logout",
    description: "Logs the user out by clearing the session cookie.",
    tags: ["Auth"],
    security: [{ cookieAuth: [] }],
  }),
  (c) => {
    deleteCookie(c, appConfig.sessionCookieName);
    return c.redirect(appConfig.ghHomepageUrl);
  },
);

export default router;

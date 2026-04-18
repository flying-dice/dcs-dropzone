import { describeRoute } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import ApplicationFactory, { authProvider } from "../hono/ApplicationFactory.ts";

export const AuthProviderLogin = ApplicationFactory.createHandlers(
	describeRoute({
		operationId: "authProviderLogin",
		tags: ["Auth"],
		summary: "Start OAuth login",
		description:
			"Initiates the OAuth web flow for the selected provider and redirects the user to the provider's authorization page.",
		responses: {
			[StatusCodes.MOVED_TEMPORARILY]: {
				description: "Redirects the user agent to the provider authorization URL.",
			},
		},
	}),
	(c) => {
		return c.redirect(authProvider.getWebFlowAuthorizationUrl());
	},
);

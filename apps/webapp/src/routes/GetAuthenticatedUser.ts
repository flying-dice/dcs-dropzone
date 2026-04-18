import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { StatusCodes } from "http-status-codes";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { UserData } from "../application/schemas/UserData.ts";
import ApplicationFactory from "../hono/ApplicationFactory.ts";
import { cookieAuth } from "../hono/middleware/cookieAuth.ts";

export const GetAuthenticatedUser = ApplicationFactory.createHandlers(
	describeJsonRoute({
		tags: ["Auth"],
		operationId: "getAuthenticatedUser",
		summary: "Get authenticated user",
		description: "Returns the authenticated user's profile derived from the session cookie.",
		security: [{ cookieAuth: [] }],
		responses: {
			[StatusCodes.OK]: UserData,
			[StatusCodes.UNAUTHORIZED]: ErrorData,
		},
	}),
	cookieAuth(),
	(c) => {
		const user = c.var.getUser();
		return c.json(user);
	},
);

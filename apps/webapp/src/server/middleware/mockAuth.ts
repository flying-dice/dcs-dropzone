import { createMiddleware } from "hono/factory";
import { getLogger } from "log4js";
import { User } from "../entities/User.ts";
import type { UserData } from "../schemas/UserData.ts";

const logger = getLogger("mockAuth");

type Env = {
	Variables: {
		getUser: () => UserData;
	};
};

// Mock user data
const mockUserData = {
	id: "mock-user-123",
	username: "mockuser",
	name: "Mock User",
	avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
	profileUrl: "https://github.com/mockuser",
};

let mockUserInitialized = false;

/**
 * Mock authentication middleware for testing.
 * Creates a fake user in the database and injects it into the request context.
 */
export const mockAuth = () =>
	createMiddleware<Env>(async (c, next) => {
		const requestId = c.get("requestId");
		logger.debug({ requestId }, "Mock auth - injecting fake user");

		// Initialize mock user in database if not already done
		if (!mockUserInitialized) {
			try {
				const existingUser = await User.findOne({ id: mockUserData.id }).exec();
				if (!existingUser) {
					await User.create(mockUserData);
					logger.info("Mock user created in database");
				} else {
					logger.debug("Mock user already exists in database");
				}
				mockUserInitialized = true;
			} catch (error) {
				logger.warn({ error }, "Error initializing mock user");
			}
		}

		// Inject mock user into context
		c.set("getUser", () => mockUserData);

		await next();
	});

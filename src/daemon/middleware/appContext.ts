import type { MiddlewareHandler } from "hono";
import type { DownloadQueue } from "../queues/DownloadQueue.ts";
import type { SubscriptionService } from "../services/SubscriptionService.ts";

/**
 * Application context variables injected via middleware
 */
export type AppContextVariables = {
	subscriptionService: SubscriptionService;
	downloadQueue: DownloadQueue;
};

/**
 * Hono app context type with injected variables
 */
export type AppContext = {
	Variables: AppContextVariables;
};

/**
 * Dependencies required for the app context middleware
 */
export type AppContextDependencies = {
	subscriptionService: SubscriptionService;
	downloadQueue: DownloadQueue;
};

/**
 * Middleware that injects application dependencies into the request context
 */
export const appContextMiddleware =
	(deps: AppContextDependencies): MiddlewareHandler<AppContext> =>
	async (c, next) => {
		c.set("subscriptionService", deps.subscriptionService);
		c.set("downloadQueue", deps.downloadQueue);
		await next();
	};

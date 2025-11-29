import type { MiddlewareHandler } from "hono";
import type { DownloadQueue } from "../queues/DownloadQueue.ts";
import type { ExtractQueue } from "../queues/ExtractQueue.ts";
import type { SubscriptionService } from "../services/SubscriptionService.ts";
import type { ToggleService } from "../services/ToggleService.ts";

/**
 * Application context variables injected via middleware
 */
export type AppContextVariables = {
	subscriptionService: SubscriptionService;
	downloadQueue: DownloadQueue;
	extractQueue: ExtractQueue;
	toggleService: ToggleService;
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
	extractQueue: ExtractQueue;
	toggleService: ToggleService;
};

/**
 * Middleware that injects application dependencies into the request context
 */
export const appContextMiddleware =
	(deps: AppContextDependencies): MiddlewareHandler<AppContext> =>
	async (c, next) => {
		c.set("subscriptionService", deps.subscriptionService);
		c.set("downloadQueue", deps.downloadQueue);
		c.set("extractQueue", deps.extractQueue);
		c.set("toggleService", deps.toggleService);
		await next();
	};

import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { MiddlewareHandler } from "hono";
import type { DownloadQueue } from "../queues/DownloadQueue.ts";
import type { ExtractQueue } from "../queues/ExtractQueue.ts";
import type { PathService } from "../services/PathService.ts";

/**
 * Hono app context type with injected variables
 */
export type AppContext = {
	Variables: {
		daemonInstanceId: string;
		downloadQueue: DownloadQueue;
		extractQueue: ExtractQueue;
		pathService: PathService;
		db: BunSQLiteDatabase;
	};
};

/**
 * Middleware that injects application dependencies into the request context
 */
export const appContextMiddleware =
	(deps: AppContext["Variables"]): MiddlewareHandler<AppContext> =>
	async (c, next) => {
		for (const [key, value] of Object.entries(deps)) {
			c.set(key as keyof AppContext["Variables"], value);
		}

		await next();
	};

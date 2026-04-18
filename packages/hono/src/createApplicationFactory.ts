import type { MiddlewareHandler } from "hono";
import { createFactory } from "hono/factory";

export type AppEnv<TApp> = {
	Variables: {
		app: TApp;
	};
};

/**
 * Hono factory typed with an Application context variable.
 *
 * Route files call `factory.createHandlers(...)` to build typed handler
 * arrays that access the Application via `c.var.app`. The app instance
 * is injected at boot time with the {@link setApp} middleware, not at
 * factory construction time, so tests can build a fresh Hono app with
 * a test Application without touching a module-load singleton.
 */
export function createApplicationFactory<TApp>() {
	return createFactory<AppEnv<TApp>>();
}

/**
 * Middleware that pins an Application instance onto `c.var.app` for
 * every downstream handler. Install once, as the first `use()` on the
 * Hono app returned by `factory.createApp()`.
 */
export function setApp<TApp>(app: TApp): MiddlewareHandler<AppEnv<TApp>> {
	return async (c, next) => {
		c.set("app", app);
		await next();
	};
}

import type { MiddlewareHandler } from "hono";
import { createFactory } from "hono/factory";
import type { Application } from "../application/Application.ts";

type Env = {
	Variables: {
		app: Application;
	};
};

export function setApp(app: Application): MiddlewareHandler<Env> {
	return async (c, next) => {
		c.set("app", app);
		await next();
	};
}

const ApplicationFactory = createFactory<Env>();

export default ApplicationFactory;

import type { MiddlewareHandler } from "hono";
import { getLogger } from "log4js";

const logger = getLogger("requestResponseLogger");

export const requestResponseLogger =
	(): MiddlewareHandler => async (c, next) => {
		const start = performance.now();

		const requestId = c.get("requestId");
		const method = c.req.method;
		const path = c.req.path;
		const params = c.req.param();
		const query = c.req.query();

		logger.debug(
			{ requestId, method, path, params, query },
			`Incoming ${method} ${path}`,
		);

		await next();

		const duration = +(performance.now() - start).toFixed(4);
		const status = c.res.status;

		logger.debug(
			{ requestId, method, path, status, duration },
			`Completed ${method} ${path} -> ${status} in ${duration}ms`,
		);
	};

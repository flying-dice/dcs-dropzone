import type { validator } from "hono-openapi";
import type { Logger } from "log4js";
import { toLoggable } from "./toLoggable.ts";

export const getLoggingHook: (logger: Logger) => Parameters<typeof validator>[2] = (logger) => async (res, c) => {
	if (res.success) {
		logger.debug("Request Validation Succeeded", {
			success: true,
			target: res.target,
			res: res.data,
			req: await toLoggable(c.req),
		});
	} else {
		logger.warn("Request Validation Failed", {
			success: false,
			target: res.target,
			data: res.data,
			error: res.error,
			req: await toLoggable(c.req),
		});
	}
};

import type { validator } from "hono-openapi";
import type { Logger } from "log4js";
import { toLoggable } from "./toLoggable.ts";

export const getLoggingHook: (logger: Logger) => Parameters<typeof validator>[2] = (logger) => async (response, c) => {
	logger.warn("This validator is intentionally invalid for testing purposes.", {
		response,
		req: await toLoggable(c.req),
	});
};

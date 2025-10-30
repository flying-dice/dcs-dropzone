import { expect, mock, test } from "bun:test";
import type { Context } from "hono";
import type { Logger } from "pino";
import { loggerMiddleware } from "./logger";

test("calls logger.debug when middleware runs", async () => {
	const logger = {
		debug: mock(() => {}),
	} as unknown as Logger;

	const c = {
		get: () => "abc123", // requestId
		req: {
			method: "GET",
			path: "/test",
			param: () => ({}),
			query: () => ({}),
		},
		res: { status: 200 },
	} as unknown as Context;

	// Call middleware with a no-op next()
	await loggerMiddleware(logger)(c, async () => {});

	// Assert the logger was called
	expect(logger.debug).toHaveBeenCalledTimes(1);
	expect(logger.debug).toHaveBeenCalledWith(
		expect.objectContaining({
			requestId: "abc123",
			status: 200,
			method: "GET",
			path: "/test",
			params: {},
			query: {},
			duration: expect.any(String),
		}),
		expect.stringContaining("Request GET /test completed with status 200 in"),
	);
});

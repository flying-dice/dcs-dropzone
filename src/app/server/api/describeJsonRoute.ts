import {
	type DescribeRouteOptions,
	describeRoute,
	resolver,
} from "hono-openapi";
import { getReasonPhrase, type StatusCodes } from "http-status-codes";
import type { z } from "zod";

type ZodResponses = {
	[K in StatusCodes]?: z.ZodTypeAny | null;
};

/**
 * Describes a route with JSON responses based on Zod schemas.
 * Convenience wrapper around `describeRoute` from `hono-openapi`.
 *
 * It automatically sets the content type to `application/json` and
 * uses the reason phrase of the status code as the description.
 *
 * @param options - The route description options, including Zod response schemas.
 * @returns The route description.
 */
export function describeJsonRoute<T extends DescribeRouteOptions>(
	options: Omit<T, "responses"> & { responses: ZodResponses },
) {
	const _options: DescribeRouteOptions = { ...options, responses: {} };

	if (!options.responses) {
		return describeRoute(_options);
	}

	if (!_options.responses) {
		_options.responses = {};
	}

	for (const [status, schema] of Object.entries(options.responses)) {
		_options.responses[status] = {
			description: getReasonPhrase(status),
			content: schema
				? {
						"application/json": {
							schema: resolver(schema),
						},
					}
				: undefined,
		};
	}

	return describeRoute(_options);
}

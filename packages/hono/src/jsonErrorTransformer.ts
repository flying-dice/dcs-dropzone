import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { ErrorData } from "./schemas.ts";

const logger = getLogger("jsonErrorTransformer");

/**
 * Transforms errors into a standardized JSON response.
 *
 * @param {Error} error - The error object thrown during request handling.
 * @param {import("hono").Context} c - The Hono context object.
 * @returns {Promise<Response>} A JSON response containing the error details.
 *
 * - If the error is an instance of `HTTPException`, it returns a JSON response
 *   with the error's status code and message.
 * - For other errors, it defaults to an internal build error (500) with the error message.
 */
export const jsonErrorTransformer: ErrorHandler = (error, c) => {
	logger.error(error);
	logger.error(`Error occurred: ${error.message}`, { error, stack: error.stack });
	if (error instanceof HTTPException) {
		return c.json(
			ErrorData.parse(<ErrorData>{
				code: error.status,
				error: error.message,
			}),
			error.status,
		);
	}

	return c.json(
		ErrorData.parse(<ErrorData>{
			code: StatusCodes.INTERNAL_SERVER_ERROR,
			error: error.message,
		}),
		StatusCodes.INTERNAL_SERVER_ERROR,
	);
};

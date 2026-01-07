import { expect, it, mock } from "bun:test";
import { HTTPException } from "hono/http-exception";
import { StatusCodes } from "http-status-codes";
import { jsonErrorTransformer } from "./jsonErrorTransformer";
import { ErrorData } from "./schemas.ts";

it("returns JSON response with HTTPException details", async () => {
	const mockContext = {
		json: mock(),
	};
	const error = new HTTPException(StatusCodes.NOT_FOUND, { message: "This was Not Found" });

	await jsonErrorTransformer(error, mockContext as any);

	expect(mockContext.json).toHaveBeenCalledWith(
		{
			code: StatusCodes.NOT_FOUND,
			message: "Not Found",
			error: "This was Not Found",
		},
		StatusCodes.NOT_FOUND,
	);
});

it("returns JSON response with internal server error for generic error", async () => {
	const mockContext = {
		json: mock(),
	};
	const error = new Error("Unexpected error");

	await jsonErrorTransformer(error, mockContext as any);

	expect(mockContext.json).toHaveBeenCalledWith(
		{
			code: StatusCodes.INTERNAL_SERVER_ERROR,
			error: "Unexpected error",
			message: "Internal Server Error",
		},
		StatusCodes.INTERNAL_SERVER_ERROR,
	);
});

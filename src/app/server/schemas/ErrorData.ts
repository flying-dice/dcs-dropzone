import { z } from "zod";

export const ErrorData = z
	.object({
		error: z.string(),
	})
	.meta({
		ref: "ErrorData",
	});

export type ErrorData = z.infer<typeof ErrorData>;

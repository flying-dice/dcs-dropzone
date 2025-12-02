import { getReasonPhrase } from "http-status-codes";
import { z } from "zod";

export const ErrorData = z
	.object({
		code: z.number().int().min(100).max(599),
		message: z.string().optional(),
		error: z.string(),
	})
	.transform((it) => ({
		...it,
		message: it.message || getReasonPhrase(it.code),
	}))
	.meta({
		ref: "ErrorData",
	});

export type ErrorData = z.infer<typeof ErrorData>;

import { getReasonPhrase } from "http-status-codes";
import { type ZodEnum, z } from "zod";

export const TypedErrorData = (error: ZodEnum) =>
	z
		.object({
			code: z.number().int().min(100).max(599),
			message: z.string().optional(),
			error,
		})
		.transform((it) => ({
			...it,
			message: it.message || getReasonPhrase(it.code),
		}));

export type TypedErrorData = z.infer<typeof TypedErrorData>;

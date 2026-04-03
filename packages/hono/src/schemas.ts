import { getReasonPhrase, StatusCodes } from "http-status-codes";
import { type ZodAny, type ZodEnum, z } from "zod";

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

export const UnprocessableEntityData = <T extends string[]>(reasons: T) =>
	z.object({
		code: z.literal(StatusCodes.UNPROCESSABLE_ENTITY).default(StatusCodes.UNPROCESSABLE_ENTITY),
		message: z.string().default(getReasonPhrase(StatusCodes.UNPROCESSABLE_ENTITY)),
		reason: z.enum(reasons),
	});

export type UnprocessableEntityData = z.infer<typeof UnprocessableEntityData>;

export const OkData = z
	.object({
		ok: z.boolean().default(true),
	})
	.meta({
		ref: "OkData",
	});

export type OkData = z.infer<typeof OkData>;

export const ErrorResult = (codes: string[], data: ZodAny = z.any()) =>
	z.object({
		status: z.number().int().min(100).max(599),
		code: z.enum(codes),
		message: z.string(),
		data,
	});

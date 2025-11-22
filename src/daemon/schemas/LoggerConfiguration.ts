import { z } from "zod";

export const LoggerConfiguration = z.object({
	colorize: z.boolean(),
	destination: z.string().optional(),
});

export type LoggerConfiguration = z.infer<typeof LoggerConfiguration>;

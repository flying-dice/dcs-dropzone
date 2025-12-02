import { z } from "zod";

export const OkData = z
	.object({
		ok: z.boolean().default(true),
	})
	.meta({
		ref: "OkData",
	});

export type OkData = z.infer<typeof OkData>;

import { z } from "zod";

export const PageData = z.object({
	size: z.coerce.number().min(1),
	totalElements: z.coerce.number().min(0),
	totalPages: z.coerce.number().min(1),
	number: z.coerce.number().min(1),
});

export type PageData = z.infer<typeof PageData>;

import { z } from "zod";

export const InvalidPathData = z.object({
	errorCode: z.enum(["PATH_NOT_FOUND"]),
	path: z.string(),
});

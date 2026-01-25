import { z } from "zod";

export const WindowClosed = z.object({
	type: z.literal("window-closed"),
});
export type WindowClosed = z.infer<typeof WindowClosed>;

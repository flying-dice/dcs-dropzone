import { z } from "zod";

export const CloseWindow = z.object({
	type: z.literal("close-window"),
});
export type CloseWindow = z.infer<typeof CloseWindow>;

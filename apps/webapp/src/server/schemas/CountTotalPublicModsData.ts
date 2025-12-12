import { z } from "zod";

export const CountTotalPublicModsData = z.object({
	totalMods: z.number(),
});

export type CountTotalPublicModsData = z.infer<typeof CountTotalPublicModsData>;

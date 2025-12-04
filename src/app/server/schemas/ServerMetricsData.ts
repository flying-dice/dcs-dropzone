import { z } from "zod";

export const ServerMetricsData = z.object({
	totalMods: z.number(),
	outdated: z.number(),
});

export type ServerMetricsData = z.infer<typeof ServerMetricsData>;

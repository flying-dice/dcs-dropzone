import { z } from "zod";

export const ServerMetricsData = z.object({
	totalMods: z.number(),
	totalDownloads: z.number(),
});

export type ServerMetricsData = z.infer<typeof ServerMetricsData>;

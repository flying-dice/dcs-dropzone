import { z } from "zod";

export const DaemonInstalledVersionsData = z.object({
	modId: z.string(),
	releaseId: z.string(),
});

export type DaemonInstalledVersionsData = z.infer<typeof DaemonInstalledVersionsData>;

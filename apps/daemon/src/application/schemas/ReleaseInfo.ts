import { z } from "zod";

export const ReleaseInfo = z.object({
	releaseId: z.string(),
	modId: z.string(),
	modName: z.string(),
	version: z.string(),
	versionHash: z.string(),
	dependencies: z.string().array(),
});

export type ReleaseInfo = z.infer<typeof ReleaseInfo>;

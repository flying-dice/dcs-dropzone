import { z } from "zod";
import { ExtractJobStatus } from "../enums/ExtractJobStatus.ts";

export const ExtractJob = z.object({
	id: z.string(),
	releaseId: z.string(),
	releaseAssetId: z.string(),
	archivePath: z.string(),
	targetDirectory: z.string(),
	status: z.enum(ExtractJobStatus),
	progressPercent: z.number(),
	attempt: z.number(),
	nextAttemptAfter: z.date(),
	createdAt: z.date(),
});

export type ExtractJob = z.infer<typeof ExtractJob>;

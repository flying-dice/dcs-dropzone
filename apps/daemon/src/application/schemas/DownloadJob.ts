import { z } from "zod";
import { DownloadJobStatus } from "../enums/DownloadJobStatus.ts";

export const DownloadJob = z.object({
	id: z.string(),
	releaseId: z.string(),
	releaseAssetId: z.string(),
	url: z.string(),
	targetDirectory: z.string(),
	status: z.enum(DownloadJobStatus),
	progressPercent: z.number(),
	attempt: z.number(),
	nextAttemptAfter: z.date(),
	createdAt: z.date(),
});

export type DownloadJob = z.infer<typeof DownloadJob>;

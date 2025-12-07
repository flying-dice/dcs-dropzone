import { z } from "zod";
import { ModReleaseCreateData } from "./ModReleaseCreateData.ts";

export const ModReleaseDownloadData = z
	.object({
		modId: z.string(),
		releaseId: z.string(),
		daemonInstanceId: z.string(),
	})
	.meta({
		ref: ModReleaseCreateData,
		title: "ModReleaseDownloadData",
		description: "Data required to download a mod release via the daemon.",
	});

export type ModReleaseDownloadData = z.infer<typeof ModReleaseDownloadData>;

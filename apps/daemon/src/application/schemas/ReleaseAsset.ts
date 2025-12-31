import { z } from "zod";

export const ReleaseAsset = z.object({
	id: z.string(),
	releaseId: z.string(),
	name: z.string(),
	isArchive: z.boolean(),
	urls: z
		.object({
			id: z.string(),
			url: z.url(),
		})
		.array(),
});

export type ReleaseAsset = z.infer<typeof ReleaseAsset>;

import { z } from "zod";

export const UserModsMetaData = z
	.object({
		published: z.number(),
		totalDownloads: z.number(),
		averageRating: z.number().min(0).max(5),
	})
	.meta({
		ref: "UserModsMetaData",
		title: "User Mods Meta Data",
		description: "Metadata representation of a user's mods.",
	});

export type UserModsMetaData = z.infer<typeof UserModsMetaData>;

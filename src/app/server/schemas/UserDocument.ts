import { z } from "zod";

export const UserDocument = z
	.object({
		id: z.string(),
		username: z.string(),
		name: z.string().nullable().optional(),
		profileUrl: z.string(),
		avatarUrl: z.string(),
		createdAt: z.date().optional(),
		updatedAt: z.date().optional(),
	})
	.meta({
		title: "UserDocument",
		description: "Database document representation of a user.",
	});

export type UserDocument = z.infer<typeof UserDocument>;

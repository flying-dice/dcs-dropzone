import { z } from "zod";

export const UserData = z
	.object({
		id: z.string(),
		username: z.string(),
		name: z.string().optional(),
		avatarUrl: z.string(),
		profileUrl: z.string(),
	})
	.meta({
		ref: "UserData",
		title: "User Data",
		description: "Data representation of a user.",
	});

export type UserData = z.infer<typeof UserData>;

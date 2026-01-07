import { z } from "zod";

export const UserTokenData = z
	.object({
		userId: z.string(),
	})
	.meta({
		ref: "UserTokenData",
		title: "User Token Data",
		description: "Data representation of a user token.",
	});

export type UserTokenData = z.infer<typeof UserTokenData>;

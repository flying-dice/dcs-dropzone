import { z } from "zod";

export const UserDtoSchema = z.object({
	id: z.string(),
	name: z.string().optional(),
	login: z.string(),
	avatarUrl: z.string().url(),
	profileUrl: z.string().url(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;

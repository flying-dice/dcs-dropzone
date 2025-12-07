import { z } from "zod";

export const zKebabCaseString = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
	message: "String must be in kebab-case format",
});

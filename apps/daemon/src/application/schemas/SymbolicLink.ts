import { SymbolicLinkDestRoot } from "webapp";
import { z } from "zod";

export const SymbolicLink = z.object({
	id: z.string(),
	releaseId: z.string(),
	name: z.string(),
	src: z.string(),
	dest: z.string(),
	destRoot: z.enum(SymbolicLinkDestRoot),
	installedPath: z.string().nullable(),
});

export type SymbolicLink = z.infer<typeof SymbolicLink>;

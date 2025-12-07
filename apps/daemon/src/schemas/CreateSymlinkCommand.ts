import { SymbolicLinkDestRoot } from "webapp";
import { z } from "zod";

export const CreateSymlinkCommand = z.object({
	symlinkId: z.string().min(1, "Symlink ID is required"),
	src: z.string().min(1, "Source path is required"),
	dest: z.string().min(1, "Destination path is required"),
	destRoot: z.enum(SymbolicLinkDestRoot),
});

export type CreateSymlinkCommand = z.infer<typeof CreateSymlinkCommand>;

import { MissionScriptRunOn, SymbolicLinkDestRoot } from "webapp";
import { z } from "zod";

export const MissionScript = z.object({
	id: z.string(),
	releaseId: z.string(),
	name: z.string(),
	purpose: z.string(),
	path: z.string(),
	root: z.enum(SymbolicLinkDestRoot),
	runOn: z.enum(MissionScriptRunOn),
	installedPath: z.string().nullable(),
});

export type MissionScript = z.infer<typeof MissionScript>;

import { SymbolicLinkDestRoot } from "webapp";
import { z } from "zod";

export const MissionScriptByRunOn = z.object({
	modName: z.string(),
	modVersion: z.string(),
	path: z.string(),
	pathRoot: z.enum(SymbolicLinkDestRoot),
});

export type MissionScriptByRunOn = z.infer<typeof MissionScriptByRunOn>;

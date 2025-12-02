import { handler } from "./handler.ts";
import type { Command, CommandResult } from "./types.ts";

export default handler;
export type CreateReleaseCommand = Command;
export type CreateReleaseResult = CommandResult;

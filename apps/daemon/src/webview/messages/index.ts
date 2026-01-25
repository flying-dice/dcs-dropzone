import { z } from "zod";
import { CloseWindow } from "./CloseWindow.ts";
import { WindowClosed } from "./WindowClosed.ts";

export const MainToWorker = z.discriminatedUnion("type", [CloseWindow]);
export type MainToWorker = z.infer<typeof MainToWorker>;
export const WorkerToMain = z.discriminatedUnion("type", [WindowClosed]);
export type WorkerToMain = z.infer<typeof WorkerToMain>;

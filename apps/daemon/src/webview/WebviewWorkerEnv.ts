import { z } from "zod";

export const WebviewWorkerEnv = z.object({
	__DROPZONE_WEBVIEW_URL: z.url(),
	__DROPZONE_WEBVIEW_DEBUG: z.coerce.boolean(),
	__DROPZONE_WEBVIEW_TITLE: z.string(),
});

export const WorkerEnv = z.record(z.string(), z.coerce.string());

export type WebviewWorkerEnv = z.infer<typeof WebviewWorkerEnv>;

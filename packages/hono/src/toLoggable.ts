import type { HonoRequest } from "hono";
import { z } from "zod";

const loggableRequestSchema = z.object({
	method: z.string(),
	path: z.string(),
	url: z.string(),
	query: z.record(z.string(), z.string()),
	params: z.record(z.string(), z.string()),
	json: z.any().optional(),
	text: z.string().optional(),
});

export async function toLoggable(req: HonoRequest) {
	return loggableRequestSchema.parse({
		method: req.method,
		path: req.path,
		url: req.url,
		query: req.query(),
		params: req.param(),
		json: await req.json().catch(() => undefined),
		text: await req.text().catch(() => undefined),
	});
}

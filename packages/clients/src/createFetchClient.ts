import { z } from "zod";
import { DropzoneClientError } from "./DropzoneClientError.ts";

export const ClientConfig = z.object({
	baseUrl: z.url().optional(),
});

export type ClientConfig = z.infer<typeof ClientConfig>;

async function autoParseByContentType(res: Response): Promise<any> {
	const ct = res.headers.get("Content-Type")?.toLowerCase() || "";

	if (ct.includes("application/json") || ct.endsWith("+json")) {
		return res.json().catch(() => null);
	}

	if (
		ct.startsWith("text/") ||
		ct === "" // Some APIs omit Content-Type; treat as text by default
	) {
		return res.text().catch(() => null);
	}

	if (ct.includes("application/x-www-form-urlencoded")) {
		return res
			.text()
			.then((text) => new URLSearchParams(text))
			.catch(() => null);
	}

	if (ct.includes("multipart/form-data")) {
		return res.formData().catch(() => null);
	}

	if (ct.startsWith("image/") || ct.startsWith("video/") || ct.startsWith("audio/")) {
		// Media -> blob
		return res.blob().catch(() => null);
	}

	if (ct.includes("application/octet-stream") || ct.includes("application/pdf") || ct.includes("application/zip")) {
		// Binary formats -> arrayBuffer
		return res.arrayBuffer().catch(() => null);
	}

	// Fallback: try JSON, then text, then null
	return res
		.json()
		.catch(() => res.text())
		.catch(() => null);
}

export function createFetchClient(config: ClientConfig = {}) {
	const _config = ClientConfig.parse(config);

	const _fetch = async <T>(url: string, options: RequestInit): Promise<T> => {
		const _url = _config.baseUrl ? new URL(url, _config.baseUrl) : url;
		const request = new Request(_url, options);
		const response = await fetch(request);

		if (!response.ok) {
			throw new DropzoneClientError({
				message: `Request failed with status ${response.status}`,
				req: request,
				res: response,
				status: response.status,
			});
		}

		const data = await autoParseByContentType(response);

		return { status: response.status, data } as T;
	};

	const _configure = (settings: ClientConfig) => {
		const parsedSettings = ClientConfig.parse(settings);
		Object.assign(_config, parsedSettings);
	};

	return {
		fetch: _fetch,
		configure: _configure,
	};
}

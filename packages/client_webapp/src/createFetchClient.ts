import { z } from "zod";

export const ClientConfig = z.object({
	baseUrl: z.url().optional(),
});

export type ClientConfig = z.infer<typeof ClientConfig>;

async function autoParseByContentType(res: Response): Promise<any> {
	const ct = res.headers.get("Content-Type")?.toLowerCase() || "";

	try {
		if (ct.includes("application/json") || ct.endsWith("+json")) {
			return await res.json();
		}

		if (
			ct.startsWith("text/") ||
			ct === "" // Some APIs omit Content-Type; treat as text by default
		) {
			return await res.text();
		}

		if (ct.includes("application/x-www-form-urlencoded")) {
			const text = await res.text();
			return new URLSearchParams(text);
		}

		if (ct.includes("multipart/form-data")) {
			return await res.formData();
		}

		if (ct.startsWith("image/") || ct.startsWith("video/") || ct.startsWith("audio/")) {
			// Media -> blob
			return await res.blob();
		}

		if (ct.includes("application/octet-stream") || ct.includes("application/pdf") || ct.includes("application/zip")) {
			// Binary formats -> arrayBuffer
			return await res.arrayBuffer();
		}

		// Fallback: try JSON, then text, then null
		try {
			return await res.json();
		} catch {
			try {
				return await res.text();
			} catch {
				return null;
			}
		}
	} catch {
		// If *parsing* throws, last-resort fallback
		return null;
	}
}

export function createFetchClient(config: ClientConfig = {}) {
	const _config = ClientConfig.parse(config);

	const _fetch = async <T>(url: string, options: RequestInit): Promise<T> => {
		const _url = new URL(url, _config.baseUrl);
		const request = new Request(_url, options);
		const response = await fetch(request);

		if (!response.ok) {
			const bodyJson = await response.json();
			throw new Error(bodyJson?.error || bodyJson?.message || `ERR: ${response.statusText}`);
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

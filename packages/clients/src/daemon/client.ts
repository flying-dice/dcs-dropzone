import { type ClientConfig, createFetchClient, type Fetch } from "../createFetchClient.ts";

let client = createFetchClient({
	baseUrl: "http://127.0.0.1:56499/",
});

export function configureFetchClient(config: ClientConfig, __fetch: Fetch) {
	client = createFetchClient(config, __fetch);
}

// Exposed as an explicit function due to orval not supporting direct client.fetch usage
export function fetch<T>(url: string, options: RequestInit): Promise<T> {
	return client.fetch<T>(url, options);
}

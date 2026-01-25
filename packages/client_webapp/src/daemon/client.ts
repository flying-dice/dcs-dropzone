import { createFetchClient } from "../createFetchClient.ts";

export const client = createFetchClient({
	baseUrl: "http://127.0.0.1:3001/",
});

// Exposed as an explicit function due to orval not supporting direct client.fetch usage
export function fetch<T>(url: string, options: RequestInit): Promise<T> {
	return client.fetch<T>(url, options);
}

import { createFetchClient } from "../createFetchClient.ts";

export const client = createFetchClient({});

// Exposed as an explicit function due to orval not supporting direct client.fetch usage
export function fetch<T>(url: string, options: RequestInit): Promise<T> {
	return client.fetch<T>(url, options);
}

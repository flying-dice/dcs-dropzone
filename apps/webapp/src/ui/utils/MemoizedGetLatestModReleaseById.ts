import { getLatestModReleaseById } from "@packages/clients/webapp";
import { Memoize } from "./memoize.ts";

export const memoizedGetLatestModReleaseById = Memoize.fn(getLatestModReleaseById, {
	keyResolver: (modId: string) => modId,
	ttlMs: 5000,
});

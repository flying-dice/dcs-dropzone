import { getLatestModReleaseById } from "../_autogen/api.ts";
import { Memoize } from "./memoize.ts";

export const memoizedGetLatestModReleaseById = Memoize.fn(getLatestModReleaseById, {
	keyResolver: (modId: string) => modId,
	ttlMs: 5000,
});

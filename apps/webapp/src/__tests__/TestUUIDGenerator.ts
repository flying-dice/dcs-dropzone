import type { UUIDGenerator } from "../application/ports/UUIDGenerator.ts";

/**
 * Creates a test UUID generator that returns sequential UUIDs for predictable testing.
 */
export function TestUUIDGenerator(): UUIDGenerator {
	let counter = 0;
	return () => {
		counter++;
		return `test-uuid-${counter.toString().padStart(4, "0")}`;
	};
}

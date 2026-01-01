import { type Mock, mock } from "bun:test";
import type { UUIDGenerator } from "../application/ports/UUIDGenerator.ts";

export const TestUUIDGenerator = (): Mock<UUIDGenerator> =>
	mock<UUIDGenerator>(() => "00000000-0000-0000-0000-000000000000");

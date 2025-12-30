import { type Mock, mock } from "bun:test";
import type { UUIDGenerator } from "../UUIDGenerator.ts";

export const TestUUIDGenerator = (): Mock<UUIDGenerator> => mock(() => "00000000-0000-0000-0000-000000000000");

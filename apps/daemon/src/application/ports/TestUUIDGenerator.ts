import { type Mock, mock } from "bun:test";
import type { UUIDGenerator } from "./UUIDGenerator.ts";

export const TestUUIDGenerator = (): Mock<UUIDGenerator> => mock();

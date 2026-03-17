import { describe, expect, it } from "bun:test";
import { env } from "./env.ts";

describe("env", () => {
	it("should have the correct environment variables", () => {
		expect(env).toBeObject();
	});
});

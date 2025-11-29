import { expect, test } from "bun:test";
import health from "../../src/daemon/api/health.ts";

test("Health check", async () => {
	const response = await health.request("/");
	expect(response.status).toBe(200);
	expect(response.json()).resolves.toEqual({ status: "UP" });
});

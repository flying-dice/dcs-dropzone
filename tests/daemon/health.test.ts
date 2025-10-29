import { expect, test } from "bun:test";
import { app } from "../../src/daemon/app";

test("Health check", async () => {
	const response = await app.request("/api/health");
	expect(response.status).toBe(200);
	expect(response.json()).resolves.toEqual({ status: "UP" });
});

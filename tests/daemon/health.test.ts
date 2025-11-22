import { expect, test } from "bun:test";
import Server from "../../src/daemon/Server.ts";

test("Health check", async () => {
	const response = await Server.request("/api/health");
	expect(response.status).toBe(200);
	expect(response.json()).resolves.toEqual({ status: "UP" });
});

import test, { expect } from "playwright/test";
import { UUID_REGEX } from "../../playwright.constants.ts";

test.describe("Daemon Health: API Tests", () => {
	test("GET /api/health returns status UP with a daemon instance ID", async ({ request }) => {
		const response = await request.get("/api/health");

		expect(response.ok()).toBeTruthy();
		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toMatchObject({ status: "UP", daemonInstanceId: expect.stringMatching(UUID_REGEX) });
	});

	test("GET /api/health returns same uuid on subsequent calls", async ({ request }) => {
		const response1 = await request.get("/api/health");
		expect(response1.ok()).toBeTruthy();
		const data1 = await response1.json();
		expect(data1).toMatchObject({ status: "UP", daemonInstanceId: expect.stringMatching(UUID_REGEX) });

		const response2 = await request.get("/api/health");
		expect(response2.ok()).toBeTruthy();
		const data2 = await response2.json();
		expect(data2.daemonInstanceId).toBe(data1.daemonInstanceId);
	});
});

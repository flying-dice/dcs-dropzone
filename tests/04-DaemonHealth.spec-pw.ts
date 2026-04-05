import { expect, test } from "./fixtures.ts";

test.describe("04 - Daemon Health: API Tests", () => {
	test("GET /api/health returns status UP with a daemon instance ID", async ({ request }) => {
		const response = await request.get("/api/health");

		expect(response.ok()).toBeTruthy();
		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty("status", "UP");
		expect(data).toHaveProperty("daemonInstanceId");
		expect(typeof data.daemonInstanceId).toBe("string");
		expect(data.daemonInstanceId.length).toBeGreaterThan(0);
	});

	test("GET /api/health returns a valid UUID as daemonInstanceId", async ({ request }) => {
		const response = await request.get("/api/health");

		expect(response.ok()).toBeTruthy();
		expect(response.status()).toBe(200);

		const data = await response.json();

		// UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		expect(data.daemonInstanceId).toMatch(uuidRegex);
	});

	test("GET /api/health returns consistent daemonInstanceId across multiple calls", async ({ request }) => {
		const response1 = await request.get("/api/health");
		expect(response1.ok()).toBeTruthy();
		const data1 = await response1.json();

		const response2 = await request.get("/api/health");
		expect(response2.ok()).toBeTruthy();
		const data2 = await response2.json();

		expect(data1.daemonInstanceId).toBe(data2.daemonInstanceId);
	});
});

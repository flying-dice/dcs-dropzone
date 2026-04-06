import { StatusCodes } from "http-status-codes";
import test, { expect } from "playwright/test";

test.describe("Webapp Health: API Tests", () => {
	test("GET /api/health returns status ok with mongoStatus true", async ({ request }) => {
		const response = await request.get("/api/health");

		expect(response.ok()).toBeTruthy();
		expect(response.status()).toBe(StatusCodes.OK);

		const data = await response.json();
		expect(data).toMatchObject({ status: "ok", mongoStatus: true });
	});
});

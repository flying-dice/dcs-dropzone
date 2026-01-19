import { describe, expect, it } from "bun:test";
import { TestApplication } from "../__tests__/TestApplication.ts";
import { HonoApplication } from "./HonoApplication.ts";

describe("HonoApplication", () => {
	describe("Private Network Access CORS", () => {
		it("should add Access-Control-Allow-Private-Network header when request includes Access-Control-Request-Private-Network", async () => {
			const app = new TestApplication();
			const honoApp = new HonoApplication(app);

			// Make an OPTIONS request with the PNA header
			const response = await honoApp.request("/api/health", {
				method: "OPTIONS",
				headers: {
					"Access-Control-Request-Private-Network": "true",
					Origin: "https://example.com",
				},
			});

			expect(response.headers.get("Access-Control-Allow-Private-Network")).toBe("true");
		});

		it("should not add Access-Control-Allow-Private-Network header when request does not include Access-Control-Request-Private-Network", async () => {
			const app = new TestApplication();
			const honoApp = new HonoApplication(app);

			// Make an OPTIONS request without the PNA header
			const response = await honoApp.request("/api/health", {
				method: "OPTIONS",
				headers: {
					Origin: "https://example.com",
				},
			});

			expect(response.headers.get("Access-Control-Allow-Private-Network")).toBeNull();
		});

		it("should add Access-Control-Allow-Private-Network header for POST preflight requests with PNA header", async () => {
			const app = new TestApplication();
			const honoApp = new HonoApplication(app);

			// Make an OPTIONS preflight request for a POST with the PNA header
			const response = await honoApp.request("/api/downloads", {
				method: "OPTIONS",
				headers: {
					"Access-Control-Request-Private-Network": "true",
					"Access-Control-Request-Method": "POST",
					Origin: "https://example.com",
				},
			});

			expect(response.headers.get("Access-Control-Allow-Private-Network")).toBe("true");
		});
	});
});

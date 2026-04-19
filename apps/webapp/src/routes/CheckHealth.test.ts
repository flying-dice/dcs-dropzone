import { afterEach, describe, expect, it, mock } from "bun:test";
import { StatusCodes } from "http-status-codes";

const mockPing = mock(() => Promise.resolve(true));

mock.module("../database", () => ({
	default: { ping: mockPing },
	applyDatabaseMigrations: async () => {},
}));

mock.module("../hono/ApplicationFactory.ts", () => {
	const { createFactory } = require("hono/factory");
	return { default: createFactory() };
});

const { Hono } = await import("hono");
const { CheckHealth } = await import("./CheckHealth.ts");

const app = new Hono();
app.get("/api/health", ...CheckHealth);

describe("CheckHealth", () => {
	afterEach(() => {
		mockPing.mockReset();
	});

	it("returns 200 when Database.ping() resolves true", async () => {
		mockPing.mockResolvedValue(true);

		const res = await app.request("/api/health");

		expect(res.status).toBe(StatusCodes.OK);
		expect(await res.json()).toMatchObject({ status: "ok", mongoStatus: true });
		expect(mockPing).toHaveBeenCalledTimes(1);
	});

	it("returns 503 when Database.ping() resolves false", async () => {
		mockPing.mockResolvedValue(false);

		const res = await app.request("/api/health");

		expect(res.status).toBe(StatusCodes.SERVICE_UNAVAILABLE);
		const body = await res.json();
		expect(body).toHaveProperty("error", "MongoDB ping returned false");
		expect(body).toHaveProperty("code", StatusCodes.SERVICE_UNAVAILABLE);
	});

	it("returns 503 when Database.ping() throws", async () => {
		mockPing.mockRejectedValue(new Error("connection refused"));

		const res = await app.request("/api/health");

		expect(res.status).toBe(StatusCodes.SERVICE_UNAVAILABLE);
		const body = await res.json();
		expect(body).toHaveProperty("error", "Error: connection refused");
		expect(body).toHaveProperty("code", StatusCodes.SERVICE_UNAVAILABLE);
	});
});

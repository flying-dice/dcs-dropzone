import { beforeEach, describe, expect, it, type Mock, mock } from "bun:test";
import { Hono } from "hono";
import { StatusCodes } from "http-status-codes";
import {
	type AppContext,
	appContextMiddleware,
} from "../middleware/appContext.ts";
import type { ToggleService } from "../services/ToggleService.ts";
import toggle from "./toggle.ts";

describe("Toggle API Router", () => {
	let mockToggleService: {
		enableRelease: Mock<(releaseId: string) => Promise<void>>;
		disableRelease: Mock<(releaseId: string) => Promise<void>>;
	};
	let app: Hono<AppContext>;

	beforeEach(() => {
		mockToggleService = {
			enableRelease: mock(() => Promise.resolve()),
			disableRelease: mock(() => Promise.resolve()),
		};

		app = new Hono<AppContext>();
		app.use(
			"*",
			appContextMiddleware({
				subscriptionService: {} as any,
				downloadQueue: {} as any,
				extractQueue: {} as any,
				toggleService: mockToggleService as unknown as ToggleService,
			}),
		);
		app.route("/", toggle);
	});

	it("POST /:releaseId/enable should call service", async () => {
		const res = await app.request("/rel-1/enable", {
			method: "POST",
		});
		expect(res.status).toBe(StatusCodes.OK);
		expect(mockToggleService.enableRelease).toHaveBeenCalledTimes(1);
		expect(mockToggleService.enableRelease).toHaveBeenCalledWith("rel-1");
	});

	it("POST /:releaseId/disable should call service", async () => {
		const res = await app.request("/rel-2/disable", {
			method: "POST",
		});
		expect(res.status).toBe(StatusCodes.OK);
		expect(mockToggleService.disableRelease).toHaveBeenCalledTimes(1);
		expect(mockToggleService.disableRelease).toHaveBeenCalledWith("rel-2");
	});
});

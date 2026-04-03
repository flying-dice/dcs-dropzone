import "../__tests__/log4js.ts";
import { describe, expect, it, beforeEach } from "bun:test";
import type { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";
import { ReleaseNotFound, ReleaseNotReady } from "../application/services/ReleaseToggle.ts";
import { TestApplication } from "../__tests__/TestApplication.ts";
import { HonoApplication } from "./HonoApplication.ts";

describe("HonoApplication", () => {
	describe("Private Network Access CORS", () => {
		it("should add Access-Control-Allow-Private-Network header when request includes Access-Control-Request-Private-Network", async () => {
			const app = new TestApplication();
			const honoApp = await HonoApplication.build(app, { enableGenerateSchema: false, uiAppConfig: { webappUrl: "http://localhost:3000/", daemonUrl: "http://localhost:56499/" } });

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
			const honoApp = await HonoApplication.build(app, { enableGenerateSchema: false, uiAppConfig: { webappUrl: "http://localhost:3000/", daemonUrl: "http://localhost:56499/" } });

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
			const honoApp = await HonoApplication.build(app, { enableGenerateSchema: false, uiAppConfig: { webappUrl: "http://localhost:3000/", daemonUrl: "http://localhost:56499/" } });

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

	describe("Toggle routes", () => {
		let app: TestApplication;
		let honoApp: HonoApplication;

		// A release with no assets is immediately "ready" — no jobs to wait for
		const readyRelease: ModAndReleaseData = {
			releaseId: "test-release-id",
			modId: "test-mod-id",
			modName: "Test Mod",
			dependencies: [],
			version: "1.0.0",
			versionHash: "abc123",
			assets: [],
			symbolicLinks: [],
			missionScripts: [],
		};

		// A release with assets has pending jobs and is not immediately ready
		const notReadyRelease: ModAndReleaseData = {
			...readyRelease,
			assets: [
				{
					id: "test-release-id__asset-1",
					name: "Test Asset",
					urls: [{ id: "test-release-id__asset-1__url-1", url: "https://example.com/sample.zip" }],
					isArchive: true,
				},
			],
		};

		beforeEach(async () => {
			app = new TestApplication();
			honoApp = await HonoApplication.build(app, { enableGenerateSchema: false, uiAppConfig: { webappUrl: "http://localhost:3000/", daemonUrl: "http://localhost:56499/" } });
		});

		describe("POST /api/toggle/:releaseId/enable", () => {
			it("should return 200 and ok:true when release is successfully enabled", async () => {
				app.addRelease(readyRelease)._unsafeUnwrap();

				const response = await honoApp.request(`/api/toggle/${readyRelease.releaseId}/enable`, { method: "POST" });

				expect(response.status).toBe(200);
				expect(await response.json()).toEqual({ ok: true });
			});

			it("should return 422 with ReleaseNotFound when release does not exist", async () => {
				const response = await honoApp.request("/api/toggle/non-existent-id/enable", { method: "POST" });

				expect(response.status).toBe(422);
				expect((await response.json()).reason).toBe(ReleaseNotFound.name);
			});

			it("should return 422 with ReleaseNotReady when release has incomplete jobs", async () => {
				app.addRelease(notReadyRelease)._unsafeUnwrap();

				const response = await honoApp.request(`/api/toggle/${notReadyRelease.releaseId}/enable`, { method: "POST" });

				expect(response.status).toBe(422);
				expect((await response.json()).reason).toBe(ReleaseNotReady.name);
			});
		});

		describe("POST /api/toggle/:releaseId/disable", () => {
			it("should return 200 and ok:true when release is successfully disabled", async () => {
				app.addRelease(readyRelease)._unsafeUnwrap();
				(await app.enableRelease(readyRelease.releaseId))._unsafeUnwrap();

				const response = await honoApp.request(`/api/toggle/${readyRelease.releaseId}/disable`, { method: "POST" });

				expect(response.status).toBe(200);
				expect(await response.json()).toEqual({ ok: true });
			});
		});

		describe("POST /api/toggle/:releaseId", () => {
			it("should return 200 and enable a disabled release", async () => {
				app.addRelease(readyRelease)._unsafeUnwrap();

				const response = await honoApp.request(`/api/toggle/${readyRelease.releaseId}`, { method: "POST" });

				expect(response.status).toBe(200);
				expect(await response.json()).toEqual({ ok: true });
				expect(app.deps.releaseRepository.getById(readyRelease.releaseId)?.enabled).toBe(true);
			});

			it("should return 200 and disable an enabled release", async () => {
				app.addRelease(readyRelease)._unsafeUnwrap();
				(await app.enableRelease(readyRelease.releaseId))._unsafeUnwrap();

				const response = await honoApp.request(`/api/toggle/${readyRelease.releaseId}`, { method: "POST" });

				expect(response.status).toBe(200);
				expect(await response.json()).toEqual({ ok: true });
				expect(app.deps.releaseRepository.getById(readyRelease.releaseId)?.enabled).toBe(false);
			});

			it("should return 422 with ReleaseNotFound when release does not exist", async () => {
				const response = await honoApp.request("/api/toggle/non-existent-id", { method: "POST" });

				expect(response.status).toBe(422);
				expect((await response.json()).reason).toBe(ReleaseNotFound.name);
			});
		});
	});
});

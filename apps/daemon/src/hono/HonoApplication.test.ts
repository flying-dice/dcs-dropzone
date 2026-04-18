import "../__tests__/log4js.ts";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync } from "node:fs";
import { TestTempDir } from "../__tests__/TestTempDir.ts";
import { SYSTEM_7ZIP_PATH, SYSTEM_WGET_PATH } from "../__tests__/utils.ts";
import type { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";
import { ProdApplication } from "../ProdApplication.ts";
import { buildHonoApp, type HonoApp } from "./HonoApplication.ts";

function buildConfiguredApp() {
	const tempDir = new TestTempDir();
	const modsDir = tempDir.join("mods");
	const dcsWorkingDir = tempDir.join("dcs", "working");
	const dcsInstallDir = tempDir.join("dcs", "install");
	mkdirSync(modsDir, { recursive: true });
	mkdirSync(dcsWorkingDir, { recursive: true });
	mkdirSync(dcsInstallDir, { recursive: true });
	const app = new ProdApplication({
		databaseUrl: ":memory:",
		wgetExecutablePath: SYSTEM_WGET_PATH,
		sevenZipExecutablePath: SYSTEM_7ZIP_PATH,
	});
	app.settings.setAll({ dropzoneModsDir: modsDir, dcsWorkingDir, dcsInstallDir });
	return { app, tempDir };
}

describe("HonoApplication", () => {
	describe("Private Network Access CORS", () => {
		let app: ProdApplication;
		let tempDir: TestTempDir;

		beforeEach(() => {
			const configured = buildConfiguredApp();
			app = configured.app;
			tempDir = configured.tempDir;
		});

		afterEach(() => {
			tempDir.cleanup();
		});

		it("should add Access-Control-Allow-Private-Network header when request includes Access-Control-Request-Private-Network", async () => {
			const honoApp = await buildHonoApp(app, {
				enableGenerateSchema: false,
				uiAppConfig: { webappUrl: "http://localhost:3000/", daemonUrl: "http://localhost:56499/" },
			});

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
			const honoApp = await buildHonoApp(app, {
				enableGenerateSchema: false,
				uiAppConfig: { webappUrl: "http://localhost:3000/", daemonUrl: "http://localhost:56499/" },
			});

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
			const honoApp = await buildHonoApp(app, {
				enableGenerateSchema: false,
				uiAppConfig: { webappUrl: "http://localhost:3000/", daemonUrl: "http://localhost:56499/" },
			});

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
		let app: ProdApplication;
		let honoApp: HonoApp;
		let tempDir: TestTempDir;

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
			const configured = buildConfiguredApp();
			app = configured.app;
			tempDir = configured.tempDir;
			honoApp = await buildHonoApp(app, {
				enableGenerateSchema: false,
				uiAppConfig: { webappUrl: "http://localhost:3000/", daemonUrl: "http://localhost:56499/" },
			});
		});

		afterEach(() => {
			tempDir.cleanup();
		});

		describe("POST /api/toggle/:releaseId/enable", () => {
			it("should return 200 and ok:true when release is successfully enabled", async () => {
				const [, addErr] = app.addRelease(readyRelease);
				expect(addErr).toBeNull();

				const response = await honoApp.request(`/api/toggle/${readyRelease.releaseId}/enable`, { method: "POST" });

				expect(response.status).toBe(200);
				expect(await response.json()).toEqual({ ok: true });
			});

			it("should return 422 with ReleaseNotFound when release does not exist", async () => {
				const response = await honoApp.request("/api/toggle/non-existent-id/enable", { method: "POST" });

				expect(response.status).toBe(422);
				const body = await response.json();
				expect(body.reason).toBe("ReleaseNotFound");
			});

			it("should return 422 with ReleaseNotReady when release has incomplete jobs", async () => {
				const [, addErr] = app.addRelease(notReadyRelease);
				expect(addErr).toBeNull();

				const response = await honoApp.request(`/api/toggle/${notReadyRelease.releaseId}/enable`, { method: "POST" });

				expect(response.status).toBe(422);
				const body = await response.json();
				expect(body.reason).toBe("ReleaseNotReady");
				expect(body.pendingCount).toBeNumber();
				expect(body.failedCount).toBeNumber();
			});
		});

		describe("POST /api/toggle/:releaseId/disable", () => {
			it("should return 200 and ok:true when release is successfully disabled", async () => {
				const [, addErr] = app.addRelease(readyRelease);
				expect(addErr).toBeNull();
				const [, enableErr] = await app.enableRelease(readyRelease.releaseId);
				expect(enableErr).toBeNull();

				const response = await honoApp.request(`/api/toggle/${readyRelease.releaseId}/disable`, { method: "POST" });

				expect(response.status).toBe(200);
				expect(await response.json()).toEqual({ ok: true });
			});

			it("should return 422 with ReleaseNotFound when release does not exist", async () => {
				const response = await honoApp.request("/api/toggle/non-existent-id/disable", { method: "POST" });

				expect(response.status).toBe(422);
				const body = await response.json();
				expect(body.reason).toBe("ReleaseNotFound");
			});
		});

		describe("POST /api/toggle/:releaseId", () => {
			it("should return 200 and enable a disabled release", async () => {
				const [, addErr] = app.addRelease(readyRelease);
				expect(addErr).toBeNull();

				const response = await honoApp.request(`/api/toggle/${readyRelease.releaseId}`, { method: "POST" });

				expect(response.status).toBe(200);
				expect(await response.json()).toEqual({ ok: true });
				expect(app.deps.releaseRepository.getById(readyRelease.releaseId)?.enabled).toBe(true);
			});

			it("should return 200 and disable an enabled release", async () => {
				const [, addErr] = app.addRelease(readyRelease);
				expect(addErr).toBeNull();
				const [, enableErr] = await app.enableRelease(readyRelease.releaseId);
				expect(enableErr).toBeNull();

				const response = await honoApp.request(`/api/toggle/${readyRelease.releaseId}`, { method: "POST" });

				expect(response.status).toBe(200);
				expect(await response.json()).toEqual({ ok: true });
				expect(app.deps.releaseRepository.getById(readyRelease.releaseId)?.enabled).toBe(false);
			});

			it("should return 422 with ReleaseNotFound when release does not exist", async () => {
				const response = await honoApp.request("/api/toggle/non-existent-id", { method: "POST" });

				expect(response.status).toBe(422);
				const body = await response.json();
				expect(body.reason).toBe("ReleaseNotFound");
			});
		});
	});
});

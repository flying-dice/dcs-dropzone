import { jsonErrorTransformer } from "@packages/hono/jsonErrorTransformer";
import { requestResponseLogger } from "@packages/hono/requestResponseLogger";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import type { BlankSchema } from "hono/types";
import { generateSpecs, openAPIRouteHandler } from "hono-openapi";
import type { z } from "zod";
import type { Application } from "../application/Application.ts";
import type { UiAppConfig } from "../config/schemas.ts";
import { AddReleaseToDaemon } from "../routes/AddReleaseToDaemon.ts";
import { DisableRelease } from "../routes/DisableRelease.ts";
import { EnableRelease } from "../routes/EnableRelease.ts";
import { GetAllDaemonReleases } from "../routes/GetAllDaemonReleases.ts";
import { GetConfig } from "../routes/GetConfig.ts";
import { GetDaemonHealth } from "../routes/GetDaemonHealth.ts";
import { GetSettings } from "../routes/GetSettings.ts";
import { GetSettingsSuggestions } from "../routes/GetSettingsSuggestions.ts";
import { GetSettingsValidation } from "../routes/GetSettingsValidation.ts";
import { PutSettings } from "../routes/PutSettings.ts";
import { RemoveReleaseFromDaemon } from "../routes/RemoveReleaseFromDaemon.ts";
import { ToggleRelease } from "../routes/ToggleRelease.ts";
import ApplicationFactory, { setApp } from "./ApplicationFactory.ts";

type BuildOptions = {
	enableGenerateSchema: boolean;
	uiAppConfig: z.infer<typeof UiAppConfig>;
};

const openapiSchema: BlankSchema = {
	documentation: {
		info: {
			title: "DCS Dropzone Daemon API",
			version: "1.0.0",
			description: "API documentation for the DCS Dropzone Daemon.",
		},
	},
};

export type HonoApp = Awaited<ReturnType<typeof buildHonoApp>>;

export async function buildHonoApp(app: Application, options: BuildOptions) {
	const honoApp = ApplicationFactory.createApp();

	honoApp.use("*", setApp(app));

	// Handle Private Network Access (PNA) preflight requests
	// https://developer.chrome.com/blog/private-network-access-preflight
	honoApp.use("*", async (c, next) => {
		const hasPnaHeader = c.req.header("Access-Control-Request-Private-Network") === "true";
		await next();
		if (hasPnaHeader) {
			c.res.headers.set("Access-Control-Allow-Private-Network", "true");
		}
	});

	honoApp.use("/*", cors());
	honoApp.use(requestId());
	honoApp.use("*", requestResponseLogger);

	honoApp.get("/api/config", ...GetConfig(options.uiAppConfig));
	honoApp.get("/api/settings", ...GetSettings);
	honoApp.get("/api/settings/suggestions", ...GetSettingsSuggestions);
	honoApp.get("/api/settings/validate", ...GetSettingsValidation);
	honoApp.put("/api/settings", ...PutSettings);
	honoApp.post("/api/downloads", ...AddReleaseToDaemon);
	honoApp.get("/api/downloads", ...GetAllDaemonReleases);
	honoApp.delete("/api/downloads/:releaseId", ...RemoveReleaseFromDaemon);
	honoApp.get("/api/health", ...GetDaemonHealth);
	honoApp.post("/api/toggle/:releaseId", ...ToggleRelease);
	honoApp.post("/api/toggle/:releaseId/enable", ...EnableRelease);
	honoApp.post("/api/toggle/:releaseId/disable", ...DisableRelease);

	honoApp.get("/v3/api-docs", openAPIRouteHandler(honoApp, openapiSchema));
	honoApp.get("/api", Scalar({ url: "/v3/api-docs" }));

	honoApp.onError(jsonErrorTransformer);

	if (options.enableGenerateSchema) {
		const spec = await generateSpecs(honoApp, openapiSchema);
		await Bun.write("openapi.schema.json", JSON.stringify(spec, undefined, 2));
	}

	return honoApp;
}

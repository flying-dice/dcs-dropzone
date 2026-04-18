import { jsonErrorTransformer } from "@packages/hono/jsonErrorTransformer";
import { requestResponseLogger } from "@packages/hono/requestResponseLogger";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { openAPIRouteHandler } from "hono-openapi";
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
import ApplicationFactory from "./ApplicationFactory.ts";

export const app = ApplicationFactory.createApp();

// Handle Private Network Access (PNA) preflight requests.
// https://developer.chrome.com/blog/private-network-access-preflight
app.use("*", async (c, next) => {
	const hasPnaHeader = c.req.header("Access-Control-Request-Private-Network") === "true";
	await next();
	if (hasPnaHeader) {
		c.res.headers.set("Access-Control-Allow-Private-Network", "true");
	}
});

app.use("/*", cors());
app.use(requestId());
app.use("*", requestResponseLogger);

app.get("/api/config", ...GetConfig);
app.get("/api/settings", ...GetSettings);
app.get("/api/settings/suggestions", ...GetSettingsSuggestions);
app.get("/api/settings/validate", ...GetSettingsValidation);
app.put("/api/settings", ...PutSettings);
app.post("/api/downloads", ...AddReleaseToDaemon);
app.get("/api/downloads", ...GetAllDaemonReleases);
app.delete("/api/downloads/:releaseId", ...RemoveReleaseFromDaemon);
app.get("/api/health", ...GetDaemonHealth);
app.post("/api/toggle/:releaseId", ...ToggleRelease);
app.post("/api/toggle/:releaseId/enable", ...EnableRelease);
app.post("/api/toggle/:releaseId/disable", ...DisableRelease);

app.get(
	"/v3/api-docs",
	openAPIRouteHandler(app, {
		documentation: {
			info: {
				title: "DCS Dropzone Daemon API",
				version: "1.0.0",
				description: "API documentation for the DCS Dropzone Daemon.",
			},
		},
	}),
);
app.get("/api", Scalar({ url: "/v3/api-docs" }));

app.onError(jsonErrorTransformer);

import { jsonErrorTransformer } from "@packages/hono/jsonErrorTransformer";
import { requestResponseLogger } from "@packages/hono/requestResponseLogger";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { openAPIRouteHandler } from "hono-openapi";
import { AuthProviderCallback } from "../routes/AuthProviderCallback.ts";
import { AuthProviderLogin } from "../routes/AuthProviderLogin.ts";
import { CheckHealth } from "../routes/CheckHealth.ts";
import { CreateUserMod } from "../routes/CreateUserMod.ts";
import { CreateUserModRelease } from "../routes/CreateUserModRelease.ts";
import { DeleteUserMod } from "../routes/DeleteUserMod.ts";
import { DeleteUserModRelease } from "../routes/DeleteUserModRelease.ts";
import { GetAuthenticatedUser } from "../routes/GetAuthenticatedUser.ts";
import { GetCategories } from "../routes/GetCategories.ts";
import { GetConfig } from "../routes/GetConfig.ts";
import { GetFeaturedMods } from "../routes/GetFeaturedMods.ts";
import { GetLatestModReleaseById } from "../routes/GetLatestModReleaseById.ts";
import { GetModById } from "../routes/GetModById.ts";
import { GetModReleaseById } from "../routes/GetModReleaseById.ts";
import { GetModReleases } from "../routes/GetModReleases.ts";
import { GetMods } from "../routes/GetMods.ts";
import { GetPopularMods } from "../routes/GetPopularMods.ts";
import { GetServerMetrics } from "../routes/GetServerMetrics.ts";
import { GetTags } from "../routes/GetTags.ts";
import { GetUserModById } from "../routes/GetUserModById.ts";
import { GetUserModReleaseById } from "../routes/GetUserModReleaseById.ts";
import { GetUserModReleases } from "../routes/GetUserModReleases.ts";
import { GetUserMods } from "../routes/GetUserMods.ts";
import { Logout } from "../routes/Logout.ts";
import { RegisterModReleaseDownloadById } from "../routes/RegisterModReleaseDownloadById.ts";
import { UpdateUserMod } from "../routes/UpdateUserMod.ts";
import { UpdateUserModRelease } from "../routes/UpdateUserModRelease.ts";
import ApplicationFactory from "./ApplicationFactory.ts";
import { openapiSchema } from "./openapi.ts";

export const app = ApplicationFactory.createApp();

app.use("/*", cors());
app.use(requestId());
app.use("*", requestResponseLogger);

app.get("/auth/callback", ...AuthProviderCallback);
app.get("/auth/login", ...AuthProviderLogin);
app.get("/auth/user", ...GetAuthenticatedUser);
app.get("/auth/logout", ...Logout);

app.get("/api/health", ...CheckHealth);
app.get("/api/config", ...GetConfig);

app.get("/api/mods", ...GetMods);
app.get("/api/mods/:id", ...GetModById);
app.get("/api/mods/:id/releases", ...GetModReleases);
app.get("/api/mods/:id/releases/latest", ...GetLatestModReleaseById);
app.get("/api/mods/:id/releases/:releaseId", ...GetModReleaseById);
app.post("/api/mods/:id/releases/:releaseId/downloads", ...RegisterModReleaseDownloadById);

app.get("/api/server-metrics", ...GetServerMetrics);
app.get("/api/featured-mods", ...GetFeaturedMods);
app.get("/api/popular-mods", ...GetPopularMods);

app.get("/api/categories", ...GetCategories);
app.get("/api/tags", ...GetTags);

app.get("/api/user-mods", ...GetUserMods);
app.get("/api/user-mods/:id", ...GetUserModById);
app.post("/api/user-mods", ...CreateUserMod);
app.put("/api/user-mods/:id", ...UpdateUserMod);
app.delete("/api/user-mods/:id", ...DeleteUserMod);

app.get("/api/user-mods/:id/releases", ...GetUserModReleases);
app.get("/api/user-mods/:id/releases/:releaseId", ...GetUserModReleaseById);
app.post("/api/user-mods/:id/releases", ...CreateUserModRelease);
app.put("/api/user-mods/:id/releases/:releaseId", ...UpdateUserModRelease);
app.delete("/api/user-mods/:id/releases/:releaseId", ...DeleteUserModRelease);

app.get("/v3/api-docs", openAPIRouteHandler(app, openapiSchema));
app.get("/api", Scalar({ url: "/v3/api-docs" }));

app.onError(jsonErrorTransformer);

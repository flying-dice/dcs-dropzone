import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { jsonErrorTransformer } from "@packages/hono/jsonErrorTransformer";
import { requestResponseLogger } from "@packages/hono/requestResponseLogger";
import { ze } from "@packages/zod";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { setSignedCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import { describeRoute, openAPIRouteHandler, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import appConfig from "../ApplicationConfig.ts";
import type { Application } from "../application/Application.ts";
import { ModCategory } from "../application/enums/ModCategory.ts";
import { ErrorData } from "../application/schemas/ErrorData.ts";
import { ModAvailableFilterData } from "../application/schemas/ModAvailableFilterData.ts";
import { ModCreateData } from "../application/schemas/ModCreateData.ts";
import { ModData } from "../application/schemas/ModData.ts";
import { ModReleaseCreateData } from "../application/schemas/ModReleaseCreateData.ts";
import { ModReleaseData } from "../application/schemas/ModReleaseData.ts";
import { ModReleaseDownloadData } from "../application/schemas/ModReleaseDownloadData.ts";
import { ModSummaryData } from "../application/schemas/ModSummaryData.ts";
import { ModUpdateData } from "../application/schemas/ModUpdateData.ts";
import { OkData } from "../application/schemas/OkData.ts";
import { PageData } from "../application/schemas/PageData.ts";
import { ServerMetricsData } from "../application/schemas/ServerMetricsData.ts";
import { TypedErrorData } from "../application/schemas/TypedErrorData.ts";
import { UserData } from "../application/schemas/UserData.ts";
import { UserModsMetaData } from "../application/schemas/UserModsMetaData.ts";
import type { AuthenticationProvider } from "../authentication/AuthenticationProvider.ts";
import Database from "../database";
import database from "../database";
import migrateLegacyRegistry from "../MigrateLegacyRegistry.ts";
import { cookieAuth } from "./middleware/cookieAuth.ts";

const logger = getLogger("HonoApplication");

type Env = {
	Variables: {
		app: Application;
		getUser: () => UserData;
	};
};

export class HonoApplication extends Hono<Env> {
	private readonly authProvider: AuthenticationProvider;

	constructor(app: Application, authProvider: AuthenticationProvider) {
		super();

		this.authProvider = authProvider;

		this.use("*", (c, next) => {
			c.set("app", app);
			return next();
		});

		this.use("/*", cors());

		this.use(requestId());

		this.use("*", requestResponseLogger);

		// Auth routes
		this.authProviderCallback();
		this.authProviderLogin();
		this.getAuthenticatedUser();
		this.logout();

		// Health route
		this.health();

		// Public mod routes
		this.getMods();
		this.getModById();
		this.getModReleases();
		this.getLatestModRelease();
		this.getModReleaseById();
		this.registerModReleaseDownload();

		// Dashboard routes
		this.getServerMetrics();
		this.getFeaturedMods();
		this.getPopularMods();

		// Category and tag routes
		this.getCategories();
		this.getTags();

		// User mod routes
		this.getUserMods();
		this.getUserModById();
		this.createUserMod();
		this.updateUserMod();
		this.deleteUserMod();

		// User mod release routes
		this.getUserModReleases();
		this.getUserModReleaseById();
		this.createUserModRelease();
		this.updateUserModRelease();
		this.deleteUserModRelease();

		// Migration route
		this.migrateLegacyRegistry();

		// API docs
		this.getApiDocs();
		this.getScalarUi();

		this.onError(jsonErrorTransformer);
	}

	private getApiDocs() {
		this.get(
			"/v3/api-docs",
			openAPIRouteHandler(this, {
				documentation: {
					info: {
						title: "DCS Dropzone Registry API",
						version: "1.0.0",
						description: "API documentation for the DCS Dropzone Registry.",
					},
					tags: [
						{ name: "Auth", description: "Authentication and session management" },
						{ name: "Health", description: "Service health and readiness" },
						{ name: "Dashboard", description: "Dashboard and metrics endpoints" },
						{ name: "Categories", description: "Mod category endpoints" },
						{ name: "Tags", description: "Mod tag endpoints" },
						{ name: "Mods", description: "Public mod catalogue endpoints" },
						{ name: "Mod Releases", description: "Public mod release endpoints" },
						{ name: "Mod Release Downloads", description: "Mod release download endpoints" },
						{
							name: "User Mods",
							description: "Manage mods owned by the authenticated user",
						},
						{
							name: "User Mod Releases",
							description: "Manage releases for user-owned mods",
						},
						{
							name: "Migration",
							description: "Administrative data migration endpoints",
						},
					],
					components: {
						securitySchemes: {
							cookieAuth: {
								type: "apiKey",
								in: "cookie",
								name: appConfig.userCookieName,
								description: "Session cookie used for authenticating user endpoints. Set after successful OAuth login.",
							},
						},
					},
				},
			}),
		);
	}

	private getScalarUi() {
		this.get("/api", Scalar({ url: "/v3/api-docs" }));
	}

	private health() {
		this.get(
			"/api/health",
			describeJsonRoute({
				operationId: "checkHealth",
				summary: "Health Check",
				description: "Checks the health status of the application.",
				tags: ["Health"],
				responses: {
					[StatusCodes.OK]: z.object({
						status: z.literal("ok"),
						version: z.string(),
						mongoStatus: z.boolean(),
					}),
					[StatusCodes.SERVICE_UNAVAILABLE]: ErrorData,
				},
			}),
			async (c) => {
				try {
					await Database.ping();
					return c.json(
						{
							status: "ok",
							version: appConfig.version,
							mongoStatus: await database.ping(),
						},
						StatusCodes.OK,
					);
				} catch (error) {
					return c.json(ErrorData.parse({ error: String(error) }), StatusCodes.SERVICE_UNAVAILABLE);
				}
			},
		);
	}

	private authProviderCallback() {
		this.get(
			"/auth/callback",
			describeRoute({
				operationId: "authProviderCallback",
				tags: ["Auth"],
				summary: "OAuth provider callback",
				description:
					"Handles the OAuth callback from the selected provider and establishes a user session via a signed cookie.",
				responses: {
					[StatusCodes.MOVED_TEMPORARILY]: {
						description: "Redirects the user to the homepage after successfully establishing a session.",
					},
				},
			}),
			validator("query", z.object({ code: z.string(), state: z.string() })),
			async (c) => {
				const { code, state } = c.req.valid("query");

				const authResult = await this.authProvider.handleCallback(code, state);

				const userData = await c.var.app.users.saveUserDetails(authResult);

				await setSignedCookie(c, appConfig.userCookieName, userData.id, appConfig.userCookieSecret, {
					maxAge: appConfig.userCookieMaxAge,
				});

				return c.redirect(appConfig.homepageUrl);
			},
		);
	}

	private authProviderLogin() {
		this.get(
			"/auth/login",
			describeRoute({
				operationId: "authProviderLogin",
				tags: ["Auth"],
				summary: "Start OAuth login",
				description:
					"Initiates the OAuth web flow for the selected provider and redirects the user to the provider's authorization page.",
				responses: {
					[StatusCodes.MOVED_TEMPORARILY]: {
						description: "Redirects the user agent to the provider authorization URL.",
					},
				},
			}),
			(c) => {
				return c.redirect(this.authProvider.getWebFlowAuthorizationUrl());
			},
		);
	}

	private getAuthenticatedUser() {
		this.get(
			"/auth/user",
			describeJsonRoute({
				tags: ["Auth"],
				operationId: "getAuthenticatedUser",
				summary: "Get authenticated user",
				description: "Returns the authenticated user's profile derived from the session cookie.",
				security: [{ cookieAuth: [] }],
				responses: {
					[StatusCodes.OK]: UserData,
					[StatusCodes.UNAUTHORIZED]: ErrorData,
				},
			}),
			cookieAuth(),
			(c) => {
				const user = c.var.getUser();
				return c.json(user);
			},
		);
	}

	private logout() {
		this.get(
			"/auth/logout",
			describeRoute({
				operationId: "logout",
				tags: ["Auth"],
				summary: "Logout",
				description: "Clears the authentication cookie and redirects to the homepage.",
				responses: {
					[StatusCodes.MOVED_TEMPORARILY]: {
						description: "Redirects the user to the homepage after logout.",
					},
					[StatusCodes.UNAUTHORIZED]: {
						description:
							"If the session is missing or invalid, the cookie is simply not present; redirect still occurs.",
					},
				},
			}),
			(c) => {
				return c.redirect(appConfig.homepageUrl ?? "http://localhost:3000");
			},
		);
	}

	// Dashboard routes
	private getServerMetrics() {
		this.get(
			"/api/server-metrics",
			describeJsonRoute({
				operationId: "getServerMetrics",
				summary: "Get Server Metrics",
				description: "Retrieves the build metrics.",
				tags: ["Dashboard"],
				responses: {
					[StatusCodes.OK]: ServerMetricsData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			async (c) => {
				const metrics = await c.var.app.publicMods.getServerMetrics();
				return c.json(metrics, StatusCodes.OK);
			},
		);
	}

	private getFeaturedMods() {
		this.get(
			"/api/featured-mods",
			describeJsonRoute({
				operationId: "getFeaturedMods",
				summary: "Get Featured mods",
				description: "Retrieves a set of featured mods.",
				tags: ["Dashboard"],
				responses: {
					[StatusCodes.OK]: ModSummaryData.array(),
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			async (c) => {
				const result = await c.var.app.publicMods.getAllFeaturedMods();
				return c.json(result, StatusCodes.OK);
			},
		);
	}

	private getPopularMods() {
		this.get(
			"/api/popular-mods",
			describeJsonRoute({
				operationId: "getPopularMods",
				summary: "Get Popular mods",
				description: "Retrieves a set of popular mods.",
				tags: ["Dashboard"],
				responses: {
					[StatusCodes.OK]: ModSummaryData.array(),
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			async (c) => {
				const result = await c.var.app.publicMods.getAllPopularMods();
				return c.json(result, StatusCodes.OK);
			},
		);
	}

	// Category and tag routes
	private getCategories() {
		this.get(
			"/api/categories",
			describeJsonRoute({
				operationId: "getCategories",
				summary: "Get Categories",
				description: "Retrieves a list of all mod categories along with the count of published mods in each category.",
				tags: ["Categories"],
				responses: {
					[StatusCodes.OK]: z.record(z.enum(ModCategory), z.number()),
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			async (c) => {
				const result = await c.var.app.publicMods.getCategoryCounts();
				return c.json(result, StatusCodes.OK);
			},
		);
	}

	private getTags() {
		this.get(
			"/api/tags",
			describeJsonRoute({
				operationId: "getTags",
				summary: "Get Tags",
				description: "Retrieves a list of all tags.",
				tags: ["Tags"],
				responses: {
					[StatusCodes.OK]: z.string().array(),
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			async (c) => {
				const result = await c.var.app.publicMods.getAllTags();
				return c.json(z.string().array().parse(result), StatusCodes.OK);
			},
		);
	}

	// Public mod routes
	private getMods() {
		this.get(
			"/api/mods",
			describeJsonRoute({
				operationId: "getMods",
				summary: "Get mods",
				description: "Retrieves a paginated list of all published mods.",
				tags: ["Mods"],
				responses: {
					[StatusCodes.OK]: z.object({
						data: ModSummaryData.array(),
						page: PageData,
						filter: ModAvailableFilterData,
					}),
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			validator(
				"query",
				z.object({
					page: PageData.shape.number,
					size: PageData.shape.size,
					category: ModSummaryData.shape.category.optional(),
					maintainers: ze.csv().optional(),
					tags: ze.csv().optional(),
					term: z.string().optional(),
				}),
			),
			async (c) => {
				const { page, size, category, maintainers, tags, term } = c.req.valid("query");

				const result = await c.var.app.publicMods.getAllPublishedMods({
					page,
					size,
					filter: {
						category,
						maintainers,
						tags,
						term,
					},
				});

				return c.json(result, StatusCodes.OK);
			},
		);
	}

	private getModById() {
		this.get(
			"/api/mods/:id",
			describeJsonRoute({
				operationId: "getModById",
				summary: "Get mod by ID",
				description: "Retrieves a specific published mod by its ID.",
				tags: ["Mods"],
				responses: {
					[StatusCodes.OK]: z.object({
						mod: ModData,
						maintainers: UserData.array(),
					}),
					[StatusCodes.NOT_FOUND]: z.object({
						message: z.string(),
					}),
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			validator(
				"param",
				z.object({
					id: z.string(),
				}),
			),
			async (c) => {
				const { id } = c.req.valid("param");

				const result = await c.var.app.publicMods.getModById(id);

				return result.match(
					(mod) => c.json(mod, StatusCodes.OK),
					(error) => c.json(ErrorData.parse(<ErrorData>{ code: StatusCodes.NOT_FOUND, error })),
				);
			},
		);
	}

	// Mod release routes
	private getModReleases() {
		this.get(
			"/api/mods/:id/releases",
			describeJsonRoute({
				operationId: "getModReleases",
				summary: "Get mod releases",
				description: "Retrieves all public releases for a specific mod.",
				tags: ["Mod Releases"],
				responses: {
					[StatusCodes.OK]: z.object({
						data: z.array(ModReleaseData),
					}),
					[StatusCodes.NOT_FOUND]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			validator("param", z.object({ id: z.string() })),
			async (c) => {
				const { id } = c.req.valid("param");

				logger.debug(`Fetching public releases for mod '${id}'`);

				const result = await c.var.app.publicMods.findPublicModReleases(id);

				return result.match(
					(data) => c.json({ data }, StatusCodes.OK),
					(error) =>
						c.json(
							ErrorData.parse({
								code: StatusCodes.NOT_FOUND,
								error,
							}),
							StatusCodes.NOT_FOUND,
						),
				);
			},
		);
	}

	private getLatestModRelease() {
		const LatestModReleaseErrors = z.enum(["ModNotFound", "ReleaseNotFound"]);

		this.get(
			"/api/mods/:id/releases/latest",
			describeJsonRoute({
				operationId: "getLatestModReleaseById",
				summary: "Get latest mod release by ID",
				description: "Retrieves the latest public release for a mod by its ID.",
				tags: ["Mod Releases"],
				responses: {
					[StatusCodes.OK]: ModReleaseData,
					[StatusCodes.NOT_FOUND]: TypedErrorData(LatestModReleaseErrors),
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			validator(
				"param",
				z.object({
					id: z.string(),
				}),
			),
			async (c) => {
				const { id } = c.req.valid("param");

				logger.debug(`Fetching latest release for mod '${id}'`);

				const result = await c.var.app.publicMods.findLatestPublicModRelease(id);

				return result.match(
					(data) => c.json(data, StatusCodes.OK),
					(error) =>
						c.json(
							ErrorData.parse(<ErrorData>{
								code: StatusCodes.NOT_FOUND,
								error,
							}),
							StatusCodes.NOT_FOUND,
						),
				);
			},
		);
	}

	private getModReleaseById() {
		this.get(
			"/api/mods/:id/releases/:releaseId",
			describeJsonRoute({
				operationId: "getModReleaseById",
				summary: "Get mod release by ID",
				description: "Retrieves a specific public release for a mod by its ID.",
				tags: ["Mod Releases"],
				responses: {
					[StatusCodes.OK]: ModReleaseData,
					[StatusCodes.NOT_FOUND]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			validator(
				"param",
				z.object({
					id: z.string(),
					releaseId: z.string(),
				}),
			),
			async (c) => {
				const { id, releaseId } = c.req.valid("param");

				logger.debug(`Fetching public release '${releaseId}' for mod '${id}'`);

				const result = await c.var.app.publicMods.findPublicModReleaseById(id, releaseId);

				return result.match(
					(data) => c.json(data, StatusCodes.OK),
					(error) =>
						c.json(
							ErrorData.parse(<ErrorData>{
								code: StatusCodes.NOT_FOUND,
								error,
							}),
							StatusCodes.NOT_FOUND,
						),
				);
			},
		);
	}

	private registerModReleaseDownload() {
		this.post(
			"/api/mods/:id/releases/:releaseId/downloads",
			describeJsonRoute({
				operationId: "registerModReleaseDownloadById",
				summary: "Register mod release download by ID",
				description: "Registers a download for a specific public release for a mod by its ID.",
				tags: ["Mod Release Downloads"],
				responses: {
					[StatusCodes.OK]: OkData,
					[StatusCodes.NOT_FOUND]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			validator(
				"param",
				z.object({
					id: z.string(),
					releaseId: z.string(),
				}),
			),
			validator("json", ModReleaseDownloadData.pick({ daemonInstanceId: true })),
			async (c) => {
				const { id, releaseId } = c.req.valid("param");
				const { daemonInstanceId } = c.req.valid("json");

				logger.debug(`Registering download for release '${releaseId}' for mod '${id}'`);

				const releaseResult = await c.var.app.publicMods.findPublicModReleaseById(id, releaseId);

				return releaseResult.match(
					async () => {
						await c.var.app.downloads.registerModReleaseDownload(id, releaseId, daemonInstanceId);
						return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
					},
					(error) => {
						return c.json(
							ErrorData.parse(<ErrorData>{
								code: StatusCodes.NOT_FOUND,
								error,
							}),
						);
					},
				);
			},
		);
	}

	// User mod routes
	private getUserMods() {
		this.get(
			"/api/user-mods",
			describeJsonRoute({
				operationId: "getUserMods",
				summary: "Get user mods",
				description: "Retrieves a list of all mods owned by the authenticated user.",
				tags: ["User Mods"],
				security: [{ cookieAuth: [] }],
				responses: {
					[StatusCodes.OK]: z.object({
						data: ModSummaryData.array(),
						meta: UserModsMetaData,
					}),
					[StatusCodes.UNAUTHORIZED]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			cookieAuth(),
			async (c) => {
				const user = c.var.getUser();

				const mods = await c.var.app.userMods.findAllMods(user);

				return c.json(mods, StatusCodes.OK);
			},
		);
	}

	private getUserModById() {
		this.get(
			"/api/user-mods/:id",
			describeJsonRoute({
				operationId: "getUserModById",
				summary: "Get user mod by ID",
				description: "Retrieves a specific mod owned by the authenticated user by its ID.",
				tags: ["User Mods"],
				security: [{ cookieAuth: [] }],
				responses: {
					[StatusCodes.OK]: ModData,
					[StatusCodes.NOT_FOUND]: ErrorData,
					[StatusCodes.UNAUTHORIZED]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			cookieAuth(),
			validator("param", z.object({ id: z.string() })),
			async (c) => {
				const { id } = c.req.valid("param");
				const user = c.var.getUser();

				logger.debug(`User '${user.id}' is requesting mod '${id}'`);

				const result = await c.var.app.userMods.findById(user, id);

				return result.match(
					(body) => {
						return c.json(body, StatusCodes.OK);
					},
					(error) => {
						return c.json(
							ErrorData.parse({
								code: StatusCodes.NOT_FOUND,
								error,
							}),
							StatusCodes.NOT_FOUND,
						);
					},
				);
			},
		);
	}

	private createUserMod() {
		this.post(
			"/api/user-mods",
			describeJsonRoute({
				operationId: "createUserMod",
				summary: "Create user mod",
				description: "Creates a new mod owned by the authenticated user.",
				tags: ["User Mods"],
				security: [{ cookieAuth: [] }],
				responses: {
					[StatusCodes.UNAUTHORIZED]: ErrorData,
					[StatusCodes.CREATED]: ModData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			cookieAuth(),
			validator("json", ModCreateData),
			async (c) => {
				const createData = c.req.valid("json");
				const user = c.var.getUser();

				logger.debug(`User '${user.id}' is creating a new mod '${createData.name}'`);
				const result = await c.var.app.userMods.createMod(user, createData);

				return c.json(result, StatusCodes.CREATED);
			},
		);
	}

	private updateUserMod() {
		this.put(
			"/api/user-mods/:id",
			describeJsonRoute({
				operationId: "updateUserMod",
				summary: "Update user mod",
				description: "Updates an existing mod owned by the authenticated user.",
				tags: ["User Mods"],
				security: [{ cookieAuth: [] }],
				responses: {
					[StatusCodes.OK]: OkData,
					[StatusCodes.NOT_FOUND]: ErrorData,
					[StatusCodes.UNAUTHORIZED]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			cookieAuth(),
			validator("param", z.object({ id: z.string() })),
			validator("json", ModUpdateData),
			async (c) => {
				const { id } = c.req.valid("param");
				const updateData = c.req.valid("json");
				const user = c.var.getUser();

				const result = await c.var.app.userMods.updateMod(user, { ...updateData, id });

				return result.match(
					() => {
						return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
					},
					(error) => {
						return c.json(
							ErrorData.parse({
								code: StatusCodes.NOT_FOUND,
								error,
							}),
							StatusCodes.NOT_FOUND,
						);
					},
				);
			},
		);
	}

	private deleteUserMod() {
		this.delete(
			"/api/user-mods/:id",
			describeJsonRoute({
				operationId: "deleteUserMod",
				summary: "Delete user mod",
				description: "Deletes an existing mod owned by the authenticated user.",
				tags: ["User Mods"],
				security: [{ cookieAuth: [] }],
				responses: {
					[StatusCodes.OK]: OkData,
					[StatusCodes.NOT_FOUND]: ErrorData,
					[StatusCodes.UNAUTHORIZED]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			cookieAuth(),
			validator("param", z.object({ id: z.string() })),
			async (c) => {
				const { id } = c.req.valid("param");
				const user = c.var.getUser();

				const result = await c.var.app.userMods.deleteMod(user, id);

				return result.match(
					() => {
						return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
					},
					(error) => {
						return c.json(
							ErrorData.parse({
								code: StatusCodes.NOT_FOUND,
								error,
							}),
							StatusCodes.NOT_FOUND,
						);
					},
				);
			},
		);
	}

	// User mod release routes
	private getUserModReleases() {
		this.get(
			"/api/user-mods/:id/releases",
			describeJsonRoute({
				operationId: "getUserModReleases",
				summary: "Get user mod releases",
				description: "Retrieves all releases for a specific mod owned by the authenticated user.",
				tags: ["User Mod Releases"],
				security: [{ cookieAuth: [] }],
				responses: {
					[StatusCodes.OK]: z.object({
						data: ModReleaseData.array(),
					}),
					[StatusCodes.NOT_FOUND]: ErrorData,
					[StatusCodes.UNAUTHORIZED]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			cookieAuth(),
			validator("param", z.object({ id: z.string() })),
			async (c) => {
				const { id } = c.req.valid("param");
				const user = c.var.getUser();

				logger.debug(`User '${user.id}' is requesting releases for mod '${id}'`);

				const result = await c.var.app.userMods.findReleases(user, id);

				return result.match(
					(data) => c.json({ data }, StatusCodes.OK),
					(error) =>
						c.json(
							ErrorData.parse({
								code: StatusCodes.NOT_FOUND,
								error,
							}),
							StatusCodes.NOT_FOUND,
						),
				);
			},
		);
	}

	private getUserModReleaseById() {
		this.get(
			"/api/user-mods/:id/releases/:releaseId",
			describeJsonRoute({
				operationId: "getUserModReleaseById",
				summary: "Get user mod release by ID",
				description: "Retrieves a specific release for a user-owned mod by its ID.",
				tags: ["User Mod Releases"],
				security: [{ cookieAuth: [] }],
				responses: {
					[StatusCodes.OK]: ModReleaseData,
					[StatusCodes.NOT_FOUND]: ErrorData,
					[StatusCodes.UNAUTHORIZED]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			cookieAuth(),
			validator(
				"param",
				z.object({
					id: z.string(),
					releaseId: z.string(),
				}),
			),
			async (c) => {
				const { id, releaseId } = c.req.valid("param");
				const user = c.var.getUser();

				logger.debug(`User '${user.id}' is requesting release '${releaseId}' for mod '${id}'`);

				const result = await c.var.app.userMods.findReleaseById(user, id, releaseId);

				return result.match(
					(body) => c.json(body, StatusCodes.OK),
					(error) =>
						c.json(
							ErrorData.parse({
								code: StatusCodes.NOT_FOUND,
								error,
							}),
							StatusCodes.NOT_FOUND,
						),
				);
			},
		);
	}

	private createUserModRelease() {
		this.post(
			"/api/user-mods/:id/releases",
			describeJsonRoute({
				operationId: "createUserModRelease",
				summary: "Create user mod release",
				description: "Creates a new release for a mod owned by the authenticated user.",
				tags: ["User Mod Releases"],
				security: [{ cookieAuth: [] }],
				responses: {
					[StatusCodes.CREATED]: ModReleaseData,
					[StatusCodes.NOT_FOUND]: ErrorData,
					[StatusCodes.UNAUTHORIZED]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			cookieAuth(),
			validator("param", z.object({ id: z.string() })),
			validator("json", ModReleaseCreateData),
			async (c) => {
				const { id } = c.req.valid("param");
				const createData = c.req.valid("json");
				const user = c.var.getUser();

				logger.debug(`User '${user.id}' is creating a new release for mod '${id}'`);

				const result = await c.var.app.userMods.createRelease(user, { ...createData, modId: id });

				return result.match(
					(body) => c.json(body, StatusCodes.CREATED),
					(error) =>
						c.json(
							ErrorData.parse({
								code: StatusCodes.NOT_FOUND,
								error,
							}),
							StatusCodes.NOT_FOUND,
						),
				);
			},
		);
	}

	private updateUserModRelease() {
		this.put(
			"/api/user-mods/:id/releases/:releaseId",
			describeJsonRoute({
				operationId: "updateUserModRelease",
				summary: "Update user mod release",
				description: "Updates fields of an existing release for a mod owned by the authenticated user.",
				tags: ["User Mod Releases"],
				security: [{ cookieAuth: [] }],
				responses: {
					[StatusCodes.OK]: OkData,
					[StatusCodes.NOT_FOUND]: ErrorData,
					[StatusCodes.UNAUTHORIZED]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			cookieAuth(),
			validator(
				"param",
				z.object({
					id: z.string(),
					releaseId: z.string(),
				}),
			),
			validator("json", ModReleaseData.omit({ id: true, modId: true, versionHash: true })),
			async (c) => {
				const { id, releaseId } = c.req.valid("param");
				const updates = c.req.valid("json");
				const user = c.var.getUser();

				logger.debug(`User '${user.id}' is updating release '${releaseId}' for mod '${id}'`);

				const result = await c.var.app.userMods.updateRelease(user, {
					id: releaseId,
					modId: id,
					...updates,
				});

				return result.match(
					() =>
						c.json(
							OkData.parse({
								ok: true,
							}),
							StatusCodes.OK,
						),
					(error) =>
						c.json(
							ErrorData.parse({
								code: StatusCodes.NOT_FOUND,
								error,
							}),
							StatusCodes.NOT_FOUND,
						),
				);
			},
		);
	}

	private deleteUserModRelease() {
		this.delete(
			"/api/user-mods/:id/releases/:releaseId",
			describeJsonRoute({
				operationId: "deleteUserModRelease",
				summary: "Delete user mod release",
				description: "Deletes an existing release for a mod owned by the authenticated user.",
				tags: ["User Mod Releases"],
				security: [{ cookieAuth: [] }],
				responses: {
					[StatusCodes.OK]: OkData,
					[StatusCodes.NOT_FOUND]: ErrorData,
					[StatusCodes.UNAUTHORIZED]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			cookieAuth(),
			validator(
				"param",
				z.object({
					id: z.string(),
					releaseId: z.string(),
				}),
			),
			async (c) => {
				const { id, releaseId } = c.req.valid("param");
				const user = c.var.getUser();

				logger.debug(`User '${user.id}' is deleting release '${releaseId}' for mod '${id}'`);

				const result = await c.var.app.userMods.deleteRelease(user, id, releaseId);

				return result.match(
					() =>
						c.json(
							OkData.parse({
								ok: true,
							}),
							StatusCodes.OK,
						),
					(error) =>
						c.json(
							ErrorData.parse({
								code: StatusCodes.NOT_FOUND,
								error,
							}),
							StatusCodes.NOT_FOUND,
						),
				);
			},
		);
	}

	// Migration route
	private migrateLegacyRegistry() {
		this.get(
			"/api/_migrate",
			describeJsonRoute({
				operationId: "migrateLegacyRegistry",
				summary: "Migrate Legacy Registry",
				description: "Migrates data from the legacy registry to the new system. Only accessible by the admin users.",
				tags: ["Migration"],
				responses: {
					[StatusCodes.OK]: OkData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			cookieAuth(),
			async (c) => {
				const user = c.var.getUser();
				logger.debug({ userId: user.id, admins: appConfig.admins }, "Migration requested by user");
				if (!appConfig.admins?.includes(user.id)) {
					throw new HTTPException(StatusCodes.UNAUTHORIZED);
				}

				await migrateLegacyRegistry({ user });

				return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
			},
		);
	}
}

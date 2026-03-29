import { describeJsonRoute } from "@packages/hono/describeJsonRoute";
import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { jsonErrorTransformer } from "@packages/hono/jsonErrorTransformer";
import { requestResponseLogger } from "@packages/hono/requestResponseLogger";
import { ErrorData, ErrorResult, OkData } from "@packages/hono/schemas";
import { zParse } from "@packages/zod/zParse";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import type { BlankSchema } from "hono/types";
import { describeRoute, generateSpecs, openAPIRouteHandler, resolver, validator } from "hono-openapi";
import { StatusCodes } from "http-status-codes";
import { getLogger } from "log4js";
import { z } from "zod";
import type { Application } from "../application/Application.ts";
import { ModAndReleaseData } from "../application/schemas/ModAndReleaseData.ts";
import { DropzoneModsDirNotConfigured } from "../application/services/PathResolver.ts";
import { appConfig } from "../config";
import { UiAppConfig } from "../config/schemas.ts";

const openapiSchema: BlankSchema = {
	documentation: {
		info: {
			title: "DCS Dropzone Daemon API",
			version: "1.0.0",
			description: "API documentation for the DCS Dropzone Daemon.",
		},
	},
};

const logger = getLogger("HonoApplication");
const loggingHook = getLoggingHook(logger);

type Env = {
	Variables: {
		app: Application;
	};
};

export class HonoApplication extends Hono<Env> {
	protected constructor(protected readonly app: Application) {
		super();
	}

	static async build(app: Application): Promise<HonoApplication> {
		const self = new HonoApplication(app);

		self.use("*", (c, next) => {
			c.set("app", app);
			return next();
		});

		// Handle Private Network Access (PNA) preflight requests
		// https://developer.chrome.com/blog/private-network-access-preflight
		self.use("*", async (c, next) => {
			// Check if this is a preflight request with the PNA header before processing
			const hasPnaHeader = c.req.header("Access-Control-Request-Private-Network") === "true";
			await next();
			// Add the PNA response header if the request included it
			if (hasPnaHeader) {
				c.res.headers.set("Access-Control-Allow-Private-Network", "true");
			}
		});

		self.use("/*", cors());

		self.use(requestId());

		self.use("*", requestResponseLogger);
		self.config();

		self.getSettings();
		self.getSettingsSuggestions();
		self.getSettingsValidation();
		self.putSettings();

		self.addReleaseToDaemon();
		self.getAllDaemonReleases();
		self.removeReleaseFromDaemon();
		self.getDaemonHealth();
		self.enableRelease();
		self.disableRelease();

		self.getApiDocs();
		self.getScalarUi();

		self.onError(jsonErrorTransformer);

		if (appConfig.enableGenerateSchema) {
			const spec = await generateSpecs(self, openapiSchema);
			await Bun.write("openapi.schema.json", JSON.stringify(spec, undefined, 2));
		}

		return self;
	}

	private config() {
		this.get(
			"/api/config",
			describeJsonRoute({
				operationId: "getConfig",
				summary: "Get Config",
				description: "Retrieves the current application configuration.",
				tags: ["Config"],
				responses: {
					[StatusCodes.OK]: UiAppConfig,
				},
			}),
			async (c) => {
				logger.info("Retrieving application config");
				return c.json(UiAppConfig.parse(appConfig));
			},
		);
	}

	private getScalarUi() {
		this.get("/api", Scalar({ url: "/v3/api-docs" }));
	}

	private getApiDocs() {
		this.get("/v3/api-docs", openAPIRouteHandler(this, openapiSchema));
	}

	private addReleaseToDaemon() {
		const UnprocessableEntityResult = ErrorResult([DropzoneModsDirNotConfigured.name]);

		this.post(
			"/api/downloads",
			describeJsonRoute({
				operationId: "addReleaseToDaemon",
				tags: ["Downloads"],
				responses: {
					[StatusCodes.OK]: null,
					[StatusCodes.UNPROCESSABLE_ENTITY]: UnprocessableEntityResult,
				},
			}),
			validator("json", ModAndReleaseData, loggingHook),

			(c) => {
				const modAndRelease = c.req.valid("json");
				logger.info("Adding release to daemon: %s", modAndRelease.releaseId ?? "unknown");

				const result = c.var.app.addRelease(modAndRelease);
				if (result.isErr()) {
					logger.error("Failed to add release: %s - %s", result.error.type, result.error.name);
					return c.json(
						zParse(
							{
								status: StatusCodes.UNPROCESSABLE_ENTITY,
								code: result.error.type,
								message: result.error.message,
								data: result.error,
							},
							UnprocessableEntityResult,
						),
						StatusCodes.UNPROCESSABLE_ENTITY,
					);
				}

				logger.info("Release added successfully");
				return c.json(null, StatusCodes.OK);
			},
		);
	}

	private getAllDaemonReleases() {
		this.get(
			"/api/downloads",
			describeJsonRoute({
				operationId: "getAllDaemonReleases",
				tags: ["Downloads"],
				responses: {
					[StatusCodes.OK]: ModAndReleaseData.array(),
				},
			}),
			(c) => {
				logger.info("Retrieving all daemon releases");
				const subscriptions = c.var.app.getAllReleasesWithStatus();
				logger.info("Retrieved %d releases", subscriptions.length);
				return c.json(subscriptions, StatusCodes.OK);
			},
		);
	}

	private removeReleaseFromDaemon() {
		this.delete(
			"/api/downloads/:releaseId",
			describeJsonRoute({
				operationId: "removeReleaseFromDaemon",
				tags: ["Downloads"],
				responses: {
					[StatusCodes.OK]: null,
				},
			}),
			validator(
				"param",
				z.object({
					releaseId: z.string(),
				}),
				loggingHook,
			),
			(c) => {
				const { releaseId } = c.req.valid("param");
				logger.info("Removing release %s from daemon", releaseId);

				c.var.app.removeRelease(releaseId);

				logger.info("Release %s removed successfully", releaseId);
				return c.json(null, StatusCodes.OK);
			},
		);
	}

	private getDaemonHealth() {
		this.get(
			"/api/health",
			describeRoute({
				operationId: "getDaemonHealth",
				tags: ["Health"],
				summary: "Daemon health check",
				description: "Checks the daemon service health by performing a lightweight database operation.",
				responses: {
					[StatusCodes.OK]: {
						description: "Service is healthy",
						content: {
							"application/json": {
								schema: resolver(
									z.object({
										status: z.literal("UP"),
										daemonInstanceId: z.string(),
									}),
								),
							},
						},
					},
					[StatusCodes.SERVICE_UNAVAILABLE]: {
						description: "Service is unavailable",
						content: {
							"application/json": {
								schema: resolver(
									z.object({
										status: z.literal("DOWN"),
										daemonInstanceId: z.string(),
										error: z.string(),
									}),
								),
							},
						},
					},
				},
			}),
			async (c) => {
				logger.info("Performing health check");
				try {
					logger.info("Health check passed - status UP");
					return c.json({ status: "UP", daemonInstanceId: c.var.app.getDaemonInstanceId() }, StatusCodes.OK);
				} catch (error) {
					logger.error("Health check failed:", error);
					return c.json(
						{ status: "DOWN", daemonInstanceId: c.var.app.getDaemonInstanceId(), error: String(error) },
						StatusCodes.SERVICE_UNAVAILABLE,
					);
				}
			},
		);
	}

	private getSettings() {
		const SettingsResponse = z.object({
			dcsWorkingDir: z.string().optional(),
			dcsInstallDir: z.string().optional(),
			dropzoneModsDir: z.string().optional(),
		});

		this.get(
			"/api/settings",
			describeJsonRoute({
				operationId: "getSettings",
				summary: "Get Settings",
				description: "Retrieves the current daemon path settings.",
				tags: ["Settings"],
				responses: {
					[StatusCodes.OK]: SettingsResponse,
				},
			}),
			(c) => {
				logger.info("Retrieving daemon settings");
				return c.json(c.var.app.settings.getAll(), StatusCodes.OK);
			},
		);
	}

	private getSettingsSuggestions() {
		const SettingsSuggestionsResponse = z.object({
			dcsWorkingDir: z.string().optional(),
			dcsInstallDir: z.string().optional(),
			dropzoneModsDir: z.string().optional(),
		});

		this.get(
			"/api/settings/suggestions",
			describeJsonRoute({
				operationId: "getSettingsSuggestions",
				summary: "Get Settings Suggestions",
				description: "Returns suggested default paths for settings based on the current system environment.",
				tags: ["Settings"],
				responses: {
					[StatusCodes.OK]: SettingsSuggestionsResponse,
				},
			}),
			(c) => {
				logger.info("Retrieving settings suggestions");

				return c.json(
					{
						dcsWorkingDir: "%USERPROFILE%\\Saved Games\\DCS",
						dcsInstallDir: "%PROGRAMFILES%\\Eagle Dynamics\\DCS World",
						dropzoneModsDir: "%LOCALAPPDATA%\\DCS Dropzone\\Mods",
					},
					StatusCodes.OK,
				);
			},
		);
	}

	private getSettingsValidation() {
		const SettingsValidationEntry = z.object({
			exists: z.boolean(),
			resolvedPath: z.string().optional(),
			error: z.string().optional(),
		});

		const SettingsValidationResponse = z.object({
			valid: z.boolean(),
			dcsWorkingDir: SettingsValidationEntry,
			dcsInstallDir: SettingsValidationEntry,
			dropzoneModsDir: SettingsValidationEntry,
		});

		this.get(
			"/api/settings/validate",
			describeJsonRoute({
				operationId: "getSettingsValidation",
				summary: "Validate Settings",
				description:
					"Validates the current daemon path settings by checking if all directories are configured and exist on disk.",
				tags: ["Settings"],
				responses: {
					[StatusCodes.OK]: SettingsValidationResponse,
				},
			}),
			(c) => {
				logger.info("Validating daemon settings");
				const result = c.var.app.settings.validate();
				logger.info("Settings validation result: valid=%s", result.valid);
				return c.json(result, StatusCodes.OK);
			},
		);
	}

	private putSettings() {
		const SettingsBody = z.object({
			dcsWorkingDir: z.string().optional(),
			dcsInstallDir: z.string().optional(),
			dropzoneModsDir: z.string().optional(),
		});

		const SettingsResponse = z.object({
			dcsWorkingDir: z.string().optional(),
			dcsInstallDir: z.string().optional(),
			dropzoneModsDir: z.string().optional(),
		});

		this.put(
			"/api/settings",
			describeJsonRoute({
				operationId: "putSettings",
				summary: "Update Settings",
				description: "Updates the daemon path settings. Only provided fields are updated.",
				tags: ["Settings"],
				responses: {
					[StatusCodes.OK]: SettingsResponse,
				},
			}),
			validator("json", SettingsBody, loggingHook),
			(c) => {
				const body = c.req.valid("json");
				logger.info("Updating daemon settings");
				const updated = c.var.app.settings.setAll(body);
				logger.info("Settings updated successfully");
				return c.json(updated, StatusCodes.OK);
			},
		);
	}

	private enableRelease() {
		this.post(
			"/api/toggle/:releaseId/enable",
			describeJsonRoute({
				operationId: "enableRelease",
				tags: ["Toggle"],
				summary: "Enable a release by creating its symbolic links",
				responses: {
					[StatusCodes.OK]: OkData,
					[StatusCodes.UNPROCESSABLE_ENTITY]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			validator("param", z.object({ releaseId: z.string() }), loggingHook),
			async (c) => {
				const { releaseId } = c.req.valid("param");
				logger.info("Enabling release %s", releaseId);
				const result = await c.var.app.enableRelease(releaseId);
				if (result.isErr()) {
					logger.error("Failed to enable release %s: %s", releaseId, result.error.type);
					return c.json(
						zParse({ error: result.error.type, code: StatusCodes.UNPROCESSABLE_ENTITY }, ErrorData),
						StatusCodes.UNPROCESSABLE_ENTITY,
					);
				}
				logger.info("Release %s enabled successfully", releaseId);
				return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
			},
		);
	}

	private disableRelease() {
		this.post(
			"/api/toggle/:releaseId/disable",
			describeJsonRoute({
				operationId: "disableRelease",
				tags: ["Toggle"],
				summary: "Disable a release by removing its symbolic links",
				responses: {
					[StatusCodes.OK]: OkData,
					[StatusCodes.UNPROCESSABLE_ENTITY]: ErrorData,
					[StatusCodes.INTERNAL_SERVER_ERROR]: ErrorData,
				},
			}),
			validator("param", z.object({ releaseId: z.string() }), loggingHook),
			async (c) => {
				const { releaseId } = c.req.valid("param");
				logger.info("Disabling release %s", releaseId);
				const result = c.var.app.disableRelease(releaseId);
				if (result.isErr()) {
					logger.error("Failed to disable release %s: %s", releaseId, result.error.type);
					return c.json(
						zParse({ error: result.error.type, code: StatusCodes.UNPROCESSABLE_ENTITY }, ErrorData),
						StatusCodes.UNPROCESSABLE_ENTITY,
					);
				}
				logger.info("Release %s disabled successfully", releaseId);
				return c.json(OkData.parse({ ok: true }), StatusCodes.OK);
			},
		);
	}
}

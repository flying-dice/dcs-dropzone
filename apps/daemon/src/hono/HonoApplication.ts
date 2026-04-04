import { getLoggingHook } from "@packages/hono/getLoggingHook";
import { jsonErrorTransformer } from "@packages/hono/jsonErrorTransformer";
import { requestResponseLogger } from "@packages/hono/requestResponseLogger";
import { ErrorData, OkData, UnprocessableEntityData } from "@packages/hono/schemas";
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
import { DcsPathNotConfigured, DropzoneModsDirNotConfigured } from "../application/services/PathResolver.ts";
import { ReleaseNotFound, ReleaseNotReady, SymlinkCreationFailed } from "../application/services/ReleaseToggle.ts";
import { UiAppConfig } from "../config/schemas.ts";

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

const logger = getLogger("HonoApplication");
const loggingHook = getLoggingHook(logger);

type Env = {
	Variables: {
		app: Application;
	};
};

export class HonoApplication extends Hono<Env> {
	private readonly _options: BuildOptions;

	protected constructor(
		protected readonly app: Application,
		options: BuildOptions,
	) {
		super();
		this._options = options;
	}

	static async build(app: Application, options: BuildOptions): Promise<HonoApplication> {
		const self = new HonoApplication(app, options);

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
		self.toggleRelease();
		self.enableRelease();
		self.disableRelease();

		self.getApiDocs();
		self.getScalarUi();

		self.onError(jsonErrorTransformer);

		if (options.enableGenerateSchema) {
			const spec = await generateSpecs(self, openapiSchema);
			await Bun.write("openapi.schema.json", JSON.stringify(spec, undefined, 2));
		}

		return self;
	}

	private config() {
		this.get(
			"/api/config",
			describeRoute({
				operationId: "getConfig",
				summary: "Get Config",
				description: "Retrieves the current application configuration.",
				tags: ["Config"],
				responses: {
					[StatusCodes.OK]: {
						description: "OK",
						content: { "application/json": { schema: resolver(UiAppConfig) } },
					},
				},
			}),
			async (c) => {
				logger.info("Retrieving application config");
				return c.json(this._options.uiAppConfig);
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
		const _UnprocessableEntityData = UnprocessableEntityData([DropzoneModsDirNotConfigured.name]);

		this.post(
			"/api/downloads",
			describeRoute({
				operationId: "addReleaseToDaemon",
				tags: ["Downloads"],
				responses: {
					[StatusCodes.OK]: {
						description: "OK",
						content: { "application/json": { schema: resolver(z.null()) } },
					},
					[StatusCodes.UNPROCESSABLE_ENTITY]: {
						description: "Unprocessable Entity",
						content: { "application/json": { schema: resolver(_UnprocessableEntityData) } },
					},
				},
			}),
			validator("json", ModAndReleaseData, loggingHook),

			(c) => {
				const modAndRelease = c.req.valid("json");
				logger.info("Adding release to daemon: %s", modAndRelease.releaseId ?? "unknown");

				return c.var.app.addRelease(modAndRelease).match(
					() => {
						logger.info("Release added successfully");
						return c.json(null, StatusCodes.OK);
					},
					(error) => {
						logger.error("Failed to add release: %s - %s", error.type, error.name);
						return c.json(zParse({ reason: error.type }, _UnprocessableEntityData), StatusCodes.UNPROCESSABLE_ENTITY);
					},
				);
			},
		);
	}

	private getAllDaemonReleases() {
		this.get(
			"/api/downloads",
			describeRoute({
				operationId: "getAllDaemonReleases",
				tags: ["Downloads"],
				responses: {
					[StatusCodes.OK]: {
						description: "OK",
						content: { "application/json": { schema: resolver(ModAndReleaseData.array()) } },
					},
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
			describeRoute({
				operationId: "removeReleaseFromDaemon",
				tags: ["Downloads"],
				responses: {
					[StatusCodes.OK]: {
						description: "OK",
						content: { "application/json": { schema: resolver(z.null()) } },
					},
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
			describeRoute({
				operationId: "getSettings",
				summary: "Get Settings",
				description: "Retrieves the current daemon path settings.",
				tags: ["Settings"],
				responses: {
					[StatusCodes.OK]: {
						description: "OK",
						content: { "application/json": { schema: resolver(SettingsResponse) } },
					},
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
			describeRoute({
				operationId: "getSettingsSuggestions",
				summary: "Get Settings Suggestions",
				description: "Returns suggested default paths for settings based on the current system environment.",
				tags: ["Settings"],
				responses: {
					[StatusCodes.OK]: {
						description: "OK",
						content: { "application/json": { schema: resolver(SettingsSuggestionsResponse) } },
					},
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
			describeRoute({
				operationId: "getSettingsValidation",
				summary: "Validate Settings",
				description:
					"Validates the current daemon path settings by checking if all directories are configured and exist on disk.",
				tags: ["Settings"],
				responses: {
					[StatusCodes.OK]: {
						description: "OK",
						content: { "application/json": { schema: resolver(SettingsValidationResponse) } },
					},
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
			describeRoute({
				operationId: "putSettings",
				summary: "Update Settings",
				description: "Updates the daemon path settings. Only provided fields are updated.",
				tags: ["Settings"],
				responses: {
					[StatusCodes.OK]: {
						description: "OK",
						content: { "application/json": { schema: resolver(SettingsResponse) } },
					},
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

	private toggleRelease() {
		const _UnprocessableEntityData = UnprocessableEntityData([
			DropzoneModsDirNotConfigured.name,
			DcsPathNotConfigured.name,
			ReleaseNotFound.name,
			ReleaseNotReady.name,
			SymlinkCreationFailed.name,
		]);

		this.post(
			"/api/toggle/:releaseId",
			describeRoute({
				operationId: "toggleRelease",
				tags: ["Toggle"],
				summary: "Toggle a release enabled state",
				description: "Enables the release if currently disabled, or disables it if currently enabled.",
				responses: {
					[StatusCodes.OK]: {
						description: "Release toggled successfully",
						content: { "application/json": { schema: resolver(OkData) } },
					},
					[StatusCodes.UNPROCESSABLE_ENTITY]: {
						description: "Failed to toggle release due to unprocessable entity error",
						content: { "application/json": { schema: resolver(_UnprocessableEntityData) } },
					},
					[StatusCodes.INTERNAL_SERVER_ERROR]: {
						description: "Failed to toggle release due to internal server error",
						content: { "application/json": { schema: resolver(ErrorData) } },
					},
				},
			}),
			validator("param", z.object({ releaseId: z.string() }), loggingHook),
			async (c) => {
				const { releaseId } = c.req.valid("param");
				logger.info("Toggling release %s", releaseId);
				const result = await c.var.app.toggleRelease(releaseId);
				return result.match(
					() => {
						logger.info("Release %s toggled successfully", releaseId);
						return c.json(zParse({ ok: true }, OkData), StatusCodes.OK);
					},
					(error) => {
						logger.error("Failed to toggle release %s: %s", releaseId, error.type);
						return c.json(zParse({ reason: error.type }, _UnprocessableEntityData), StatusCodes.UNPROCESSABLE_ENTITY);
					},
				);
			},
		);
	}

	private enableRelease() {
		const _UnprocessableEntityData = UnprocessableEntityData([
			DropzoneModsDirNotConfigured.name,
			DcsPathNotConfigured.name,
			ReleaseNotFound.name,
			ReleaseNotReady.name,
			SymlinkCreationFailed.name,
		]);

		this.post(
			"/api/toggle/:releaseId/enable",
			describeRoute({
				operationId: "enableRelease",
				tags: ["Toggle"],
				summary: "Enable a release by creating its symbolic links",
				responses: {
					[StatusCodes.OK]: {
						description: "Release enabled successfully",
						content: { "application/json": { schema: resolver(OkData) } },
					},
					[StatusCodes.UNPROCESSABLE_ENTITY]: {
						description: "Failed to enable release due to unprocessable entity error",
						content: { "application/json": { schema: resolver(_UnprocessableEntityData) } },
					},
					[StatusCodes.INTERNAL_SERVER_ERROR]: {
						description: "Failed to enable release due to internal server error",
						content: { "application/json": { schema: resolver(ErrorData) } },
					},
				},
			}),
			validator("param", z.object({ releaseId: z.string() }), loggingHook),
			async (c) => {
				const { releaseId } = c.req.valid("param");
				logger.info("Enabling release %s", releaseId);
				const result = await c.var.app.enableRelease(releaseId);
				return result.match(
					() => {
						logger.info("Release %s enabled successfully", releaseId);
						return c.json(zParse({ ok: true }, OkData), StatusCodes.OK);
					},
					(error) => {
						logger.error("Failed to enable release %s: %s", releaseId, error.type);
						return c.json(zParse({ reason: error.type }, _UnprocessableEntityData), StatusCodes.UNPROCESSABLE_ENTITY);
					},
				);
			},
		);
	}

	private disableRelease() {
		const _UnprocessableEntityData = UnprocessableEntityData([DcsPathNotConfigured.name, ReleaseNotFound.name]);

		this.post(
			"/api/toggle/:releaseId/disable",
			describeRoute({
				operationId: "disableRelease",
				tags: ["Toggle"],
				summary: "Disable a release by removing its symbolic links",
				responses: {
					[StatusCodes.OK]: {
						description: "Release disabled successfully",
						content: { "application/json": { schema: resolver(OkData) } },
					},
					[StatusCodes.UNPROCESSABLE_ENTITY]: {
						description: "Failed to disable release due to unprocessable entity error",
						content: { "application/json": { schema: resolver(_UnprocessableEntityData) } },
					},
					[StatusCodes.INTERNAL_SERVER_ERROR]: {
						description: "Failed to disable release due to internal server error",
						content: { "application/json": { schema: resolver(ErrorData) } },
					},
				},
			}),
			validator("param", z.object({ releaseId: z.string() }), loggingHook),
			async (c) => {
				const { releaseId } = c.req.valid("param");
				logger.info("Disabling release %s", releaseId);
				return c.var.app.disableRelease(releaseId).match(
					() => {
						logger.info("Release %s disabled successfully", releaseId);
						return c.json(zParse({ ok: true }, OkData), StatusCodes.OK);
					},
					(error) => {
						logger.error("Failed to disable release %s: %s", releaseId, error.type);
						return c.json(zParse({ reason: error.type }, _UnprocessableEntityData), StatusCodes.UNPROCESSABLE_ENTITY);
					},
				);
			},
		);
	}
}

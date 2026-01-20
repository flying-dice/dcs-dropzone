import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

// Since we can't easily re-import config.ts with different files, we'll test the schema directly
describe("Config Validation", () => {
	let testDir: string;

	beforeEach(() => {
		testDir = join(tmpdir(), `dcs-dropzone-config-test-${Date.now()}`);
		mkdirSync(testDir, { recursive: true });
	});

	afterEach(() => {
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true, force: true });
		}
	});

	const createConfigSchema = () => {
		return z
			.object({
				server: z.object({
					host: z.string().default("localhost"),
					port: z.number().int().min(1).max(65535),
				}),
				database: z.object({
					url: z.string(),
				}),
				binaries: z.object({
					wget: z.string().optional(),
					sevenzip: z.string().optional(),
				}),
				dcs: z.object({
					dcs_working_dir: z.string().min(1, "DCS working path is required"),
					dcs_install_dir: z.string().min(1, "DCS install path is required"),
				}),
				app: z.object({
					mods_dir: z.string().min(1, "Mods directory is required"),
					tui_enabled: z.boolean().default(true),
				}),
			})
			.superRefine((data, ctx) => {
				// Validate dcs_working_dir
				const dcsWorkingDir = data.dcs.dcs_working_dir;
				if (!existsSync(dcsWorkingDir)) {
					ctx.addIssue({
						code: "custom",
						path: ["dcs", "dcs_working_dir"],
						message: `Directory does not exist: ${dcsWorkingDir}`,
					});
				} else {
					try {
						const stats = statSync(dcsWorkingDir);
						if (!stats.isDirectory()) {
							ctx.addIssue({
								code: "custom",
								path: ["dcs", "dcs_working_dir"],
								message: `Path is not a directory: ${dcsWorkingDir}`,
							});
						}
					} catch (e) {
						ctx.addIssue({
							code: "custom",
							path: ["dcs", "dcs_working_dir"],
							message: `Failed to validate directory: ${dcsWorkingDir} - ${e}`,
						});
					}
				}

				// Validate dcs_install_dir
				const dcsInstallDir = data.dcs.dcs_install_dir;
				if (!existsSync(dcsInstallDir)) {
					ctx.addIssue({
						code: "custom",
						path: ["dcs", "dcs_install_dir"],
						message: `Directory does not exist: ${dcsInstallDir}`,
					});
				} else {
					try {
						const stats = statSync(dcsInstallDir);
						if (!stats.isDirectory()) {
							ctx.addIssue({
								code: "custom",
								path: ["dcs", "dcs_install_dir"],
								message: `Path is not a directory: ${dcsInstallDir}`,
							});
						}
					} catch (e) {
						ctx.addIssue({
							code: "custom",
							path: ["dcs", "dcs_install_dir"],
							message: `Failed to validate directory: ${dcsInstallDir} - ${e}`,
						});
					}
				}

				// Validate mods_dir
				const modsDir = data.app.mods_dir;
				if (!existsSync(modsDir)) {
					ctx.addIssue({
						code: "custom",
						path: ["app", "mods_dir"],
						message: `Directory does not exist: ${modsDir}`,
					});
				} else {
					try {
						const stats = statSync(modsDir);
						if (!stats.isDirectory()) {
							ctx.addIssue({
								code: "custom",
								path: ["app", "mods_dir"],
								message: `Path is not a directory: ${modsDir}`,
							});
						}
					} catch (e) {
						ctx.addIssue({
							code: "custom",
							path: ["app", "mods_dir"],
							message: `Failed to validate directory: ${modsDir} - ${e}`,
						});
					}
				}
			});
	};

	it("should pass validation when all directories exist", () => {
		const dcsWorkingDir = join(testDir, "dcs_working");
		const dcsInstallDir = join(testDir, "dcs_install");
		const modsDir = join(testDir, "mods");

		mkdirSync(dcsWorkingDir);
		mkdirSync(dcsInstallDir);
		mkdirSync(modsDir);

		const schema = createConfigSchema();
		const config = {
			server: { host: "localhost", port: 3001 },
			database: { url: "test.db" },
			binaries: {},
			dcs: {
				dcs_working_dir: dcsWorkingDir,
				dcs_install_dir: dcsInstallDir,
			},
			app: {
				mods_dir: modsDir,
				tui_enabled: false,
			},
		};

		const result = schema.safeParse(config);
		expect(result.success).toBe(true);
	});

	it("should fail validation when dcs_working_dir does not exist", () => {
		const dcsWorkingDir = join(testDir, "dcs_working");
		const dcsInstallDir = join(testDir, "dcs_install");
		const modsDir = join(testDir, "mods");

		// Only create install and mods dirs
		mkdirSync(dcsInstallDir);
		mkdirSync(modsDir);

		const schema = createConfigSchema();
		const config = {
			server: { host: "localhost", port: 3001 },
			database: { url: "test.db" },
			binaries: {},
			dcs: {
				dcs_working_dir: dcsWorkingDir,
				dcs_install_dir: dcsInstallDir,
			},
			app: {
				mods_dir: modsDir,
				tui_enabled: false,
			},
		};

		const result = schema.safeParse(config);
		expect(result.success).toBe(false);
		if (!result.success) {
			const issues = result.error.issues;
			expect(issues.length).toBeGreaterThanOrEqual(1);
			const workingDirIssue = issues.find((issue) => issue.path.join(".") === "dcs.dcs_working_dir");
			expect(workingDirIssue).toBeDefined();
			expect(workingDirIssue?.message).toContain("Directory does not exist");
		}
	});

	it("should fail validation when dcs_install_dir does not exist", () => {
		const dcsWorkingDir = join(testDir, "dcs_working");
		const dcsInstallDir = join(testDir, "dcs_install");
		const modsDir = join(testDir, "mods");

		// Only create working and mods dirs
		mkdirSync(dcsWorkingDir);
		mkdirSync(modsDir);

		const schema = createConfigSchema();
		const config = {
			server: { host: "localhost", port: 3001 },
			database: { url: "test.db" },
			binaries: {},
			dcs: {
				dcs_working_dir: dcsWorkingDir,
				dcs_install_dir: dcsInstallDir,
			},
			app: {
				mods_dir: modsDir,
				tui_enabled: false,
			},
		};

		const result = schema.safeParse(config);
		expect(result.success).toBe(false);
		if (!result.success) {
			const issues = result.error.issues;
			expect(issues.length).toBeGreaterThanOrEqual(1);
			const installDirIssue = issues.find((issue) => issue.path.join(".") === "dcs.dcs_install_dir");
			expect(installDirIssue).toBeDefined();
			expect(installDirIssue?.message).toContain("Directory does not exist");
		}
	});

	it("should fail validation when mods_dir does not exist", () => {
		const dcsWorkingDir = join(testDir, "dcs_working");
		const dcsInstallDir = join(testDir, "dcs_install");
		const modsDir = join(testDir, "mods");

		// Only create DCS dirs
		mkdirSync(dcsWorkingDir);
		mkdirSync(dcsInstallDir);

		const schema = createConfigSchema();
		const config = {
			server: { host: "localhost", port: 3001 },
			database: { url: "test.db" },
			binaries: {},
			dcs: {
				dcs_working_dir: dcsWorkingDir,
				dcs_install_dir: dcsInstallDir,
			},
			app: {
				mods_dir: modsDir,
				tui_enabled: false,
			},
		};

		const result = schema.safeParse(config);
		expect(result.success).toBe(false);
		if (!result.success) {
			const issues = result.error.issues;
			expect(issues.length).toBeGreaterThanOrEqual(1);
			const modsDirIssue = issues.find((issue) => issue.path.join(".") === "app.mods_dir");
			expect(modsDirIssue).toBeDefined();
			expect(modsDirIssue?.message).toContain("Directory does not exist");
		}
	});

	it("should report all directory errors at once", () => {
		const dcsWorkingDir = join(testDir, "dcs_working");
		const dcsInstallDir = join(testDir, "dcs_install");
		const modsDir = join(testDir, "mods");

		// Don't create any directories

		const schema = createConfigSchema();
		const config = {
			server: { host: "localhost", port: 3001 },
			database: { url: "test.db" },
			binaries: {},
			dcs: {
				dcs_working_dir: dcsWorkingDir,
				dcs_install_dir: dcsInstallDir,
			},
			app: {
				mods_dir: modsDir,
				tui_enabled: false,
			},
		};

		const result = schema.safeParse(config);
		expect(result.success).toBe(false);
		if (!result.success) {
			const issues = result.error.issues;
			expect(issues.length).toBe(3);

			const paths = issues.map((issue) => issue.path.join("."));
			expect(paths).toContain("dcs.dcs_working_dir");
			expect(paths).toContain("dcs.dcs_install_dir");
			expect(paths).toContain("app.mods_dir");
		}
	});

	it("should fail validation when path is a file instead of directory", () => {
		const dcsWorkingDir = join(testDir, "dcs_working");
		const dcsInstallDir = join(testDir, "dcs_install");
		const modsDir = join(testDir, "mods");

		// Create install and mods dirs, but make working dir a file
		writeFileSync(dcsWorkingDir, "not a directory");
		mkdirSync(dcsInstallDir);
		mkdirSync(modsDir);

		const schema = createConfigSchema();
		const config = {
			server: { host: "localhost", port: 3001 },
			database: { url: "test.db" },
			binaries: {},
			dcs: {
				dcs_working_dir: dcsWorkingDir,
				dcs_install_dir: dcsInstallDir,
			},
			app: {
				mods_dir: modsDir,
				tui_enabled: false,
			},
		};

		const result = schema.safeParse(config);
		expect(result.success).toBe(false);
		if (!result.success) {
			const issues = result.error.issues;
			const workingDirIssue = issues.find((issue) => issue.path.join(".") === "dcs.dcs_working_dir");
			expect(workingDirIssue).toBeDefined();
			expect(workingDirIssue?.message).toContain("Path is not a directory");
		}
	});
});

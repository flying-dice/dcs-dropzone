import { defineConfig, devices } from "playwright/test";
import { PW_DAEMON_BASE_URL, PW_WEBAPP_BASE_URL } from "./playwright.constants";

export default defineConfig({
	// Look for test files in the "tests" directory, relative to this configuration file.
	testDir: "tests",
	testMatch: "**/*.spec-pw.ts",

	// Fail the build on CI if you accidentally left test.only in the source code.
	forbidOnly: !!process.env.CI,

	// Retry once on CI to absorb timing flakes on Windows runners.
	retries: process.env.CI ? 1 : 0,

	// Run webapp and daemon projects in parallel (they target independent servers).
	workers: process.env.CI ? 2 : undefined,

	// Reporter to use
	reporter: [["html", { outputFolder: ".playwright-report" }]],
	outputDir: ".test-results/",

	use: {
		// Collect trace when retrying the failed test.
		trace: "on-first-retry",

		// Record video for every test.
		video: "on",
	},
	// Configure projects for major browsers.
	projects: [
		{
			name: "webapp",
			testMatch: "webapp/*.spec-pw.ts",
			use: { ...devices["Desktop Chrome"], baseURL: PW_WEBAPP_BASE_URL },
		},
		{
			name: "daemon",
			testMatch: "daemon/*.spec-pw.ts",
			use: { ...devices["Desktop Chrome"], baseURL: PW_DAEMON_BASE_URL },
		},
	],
	// Run your local dev servers before starting the tests.
	webServer: [
		{
			command: "bun playwright.webapp.setup.ts",
			url: `${PW_WEBAPP_BASE_URL}/api/health`,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: "bun playwright.daemon.setup.ts",
			url: `${PW_DAEMON_BASE_URL}/api/health`,
			reuseExistingServer: !process.env.CI,
		},
	],
});

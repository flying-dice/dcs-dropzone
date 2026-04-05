import { defineConfig, devices } from "playwright/test";

export default defineConfig({
	// Look for test files in the "tests" directory, relative to this configuration file.
	testDir: "tests",
	testMatch: "**/*.spec-pw.ts",

	// Fail the build on CI if you accidentally left test.only in the source code.
	forbidOnly: !!process.env.CI,

	// Retry on CI only.
	retries: process.env.CI ? 2 : 0,

	// Run webapp and daemon projects in parallel (they target independent servers).
	workers: process.env.CI ? 2 : undefined,

	// Reporter to use
	reporter: [["html", { outputFolder: ".playwright-report" }]],
	outputDir: ".test-results/",

	use: {
		// Base URL to use in actions like `await page.goto('/')`.
		baseURL: "http://localhost:3000",

		// Collect trace when retrying the failed test.
		trace: "on-first-retry",

		// Only record video on failure to save time and storage.
		video: "retain-on-failure",
	},
	// Configure projects for major browsers.
	projects: [
		{
			name: "webapp",
			testMatch: "**/01-*.spec-pw.ts",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "daemon",
			testMatch: "**/02-*.spec-pw.ts",
			use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:56499" },
		},
	],
	// Run your local dev servers before starting the tests.
	webServer: [
		{
			command: "bun playwright.setup.ts",
			url: "http://localhost:3000",
			reuseExistingServer: !process.env.CI,
		},
		{
			command: "bun playwright.daemon.setup.ts",
			url: "http://127.0.0.1:56499/api/health",
			reuseExistingServer: !process.env.CI,
		},
	],
});

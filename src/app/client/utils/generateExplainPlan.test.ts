import { describe, expect, test } from "bun:test";
import {
	MissionScriptRunOn,
	ModVisibility,
	SymbolicLinkDestRoot,
} from "../../../common/data";
import type { ModReleaseData } from "../_autogen/api";
import { generateExplainPlan } from "./generateExplainPlan";

describe("generateExplainPlan", () => {
	test("generates plan for release with no actionable items", () => {
		const release: ModReleaseData = {
			id: "test-release-1",
			mod_id: "test-mod-1",
			version: "1.0.0",
			changelog: "Initial release",
			assets: [],
			symbolicLinks: [],
			missionScripts: [],
			visibility: ModVisibility.Public,
		};

		const plan = generateExplainPlan(release);

		expect(plan).toContain("Installation Plan for Release 1.0.0");
		expect(plan).toContain("Initial release");
		expect(plan).toContain("no actionable items");
		expect(plan).toContain("No files will be downloaded");
	});

	test("generates plan with single asset (non-archive)", () => {
		const release: ModReleaseData = {
			id: "test-release-2",
			mod_id: "test-mod-1",
			version: "1.1.0",
			changelog: "Bug fixes",
			assets: [
				{
					name: "mod-file.lua",
					urls: ["https://example.com/mod-file.lua"],
					isArchive: false,
				},
			],
			symbolicLinks: [],
			missionScripts: [],
			visibility: ModVisibility.Public,
		};

		const plan = generateExplainPlan(release);

		expect(plan).toContain("Assets");
		expect(plan).toContain("mod-file.lua");
		expect(plan).toContain("from the provided URL");
		expect(plan).not.toContain("extracted");
		expect(plan).toContain("1 asset will be downloaded");
	});

	test("generates plan with archive asset", () => {
		const release: ModReleaseData = {
			id: "test-release-3",
			mod_id: "test-mod-1",
			version: "2.0.0",
			changelog: "Major update",
			assets: [
				{
					name: "mod-package.zip",
					urls: ["https://example.com/mod.zip"],
					isArchive: true,
				},
			],
			symbolicLinks: [],
			missionScripts: [],
			visibility: ModVisibility.Public,
		};

		const plan = generateExplainPlan(release);

		expect(plan).toContain("mod-package.zip");
		expect(plan).toContain("archive file");
		expect(plan).toContain("automatically extracted");
		expect(plan).toContain("1 asset will be downloaded");
		expect(plan).toContain("1 archive will be extracted");
	});

	test("generates plan with multipart archive URLs", () => {
		const release: ModReleaseData = {
			id: "test-release-4",
			mod_id: "test-mod-1",
			version: "1.2.0",
			changelog: "Performance improvements",
			assets: [
				{
					name: "mod.zip",
					urls: [
						"https://cdn.example.com/mod.part1.zip",
						"https://cdn.example.com/mod.part2.zip",
						"https://cdn.example.com/mod.part3.zip",
					],
					isArchive: true,
				},
			],
			symbolicLinks: [],
			missionScripts: [],
			visibility: ModVisibility.Public,
		};

		const plan = generateExplainPlan(release);

		expect(plan).toContain("from 3 URLs (multipart archive)");
	});

	test("generates plan with symbolic links (working directory)", () => {
		const release: ModReleaseData = {
			id: "test-release-5",
			mod_id: "test-mod-1",
			version: "1.3.0",
			changelog: "Added symlinks",
			assets: [],
			symbolicLinks: [
				{
					src: "/path/to/source",
					dest: "/path/to/destination",
					destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				},
			],
			missionScripts: [],
			visibility: ModVisibility.Public,
		};

		const plan = generateExplainPlan(release);

		expect(plan).toContain("Symbolic Links");
		expect(plan).toContain("/path/to/source");
		expect(plan).toContain("/path/to/destination");
		expect(plan).toContain("DCS working directory (Saved Games)");
		expect(plan).toContain("1 symbolic link will be created");
	});

	test("generates plan with symbolic links (install directory)", () => {
		const release: ModReleaseData = {
			id: "test-release-6",
			mod_id: "test-mod-1",
			version: "1.4.0",
			changelog: "Install dir symlink",
			assets: [],
			symbolicLinks: [
				{
					src: "/mod/source",
					dest: "/mod/dest",
					destRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
				},
			],
			missionScripts: [],
			visibility: ModVisibility.Public,
		};

		const plan = generateExplainPlan(release);

		expect(plan).toContain("DCS installation directory");
	});

	test("generates plan with mission scripts (before sanitize)", () => {
		const release: ModReleaseData = {
			id: "test-release-7",
			mod_id: "test-mod-1",
			version: "1.5.0",
			changelog: "Mission scripts added",
			assets: [],
			symbolicLinks: [],
			missionScripts: [
				{
					path: "Scripts/MyMod.lua",
					root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
					runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
				},
			],
			visibility: ModVisibility.Public,
		};

		const plan = generateExplainPlan(release);

		expect(plan).toContain("Mission Scripts");
		expect(plan).toContain("Scripts/MyMod.lua");
		expect(plan).toContain("Mission Start (Before Sanitize)");
		expect(plan).toContain("DCS working directory (Saved Games)");
		expect(plan).toContain("1 mission script will be installed");
	});

	test("generates plan with mission scripts (after sanitize)", () => {
		const release: ModReleaseData = {
			id: "test-release-8",
			mod_id: "test-mod-1",
			version: "1.6.0",
			changelog: "Post-sanitize script",
			assets: [],
			symbolicLinks: [],
			missionScripts: [
				{
					path: "Scripts/PostInit.lua",
					root: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
					runOn: MissionScriptRunOn.MISSION_START_AFTER_SANITIZE,
				},
			],
			visibility: ModVisibility.Public,
		};

		const plan = generateExplainPlan(release);

		expect(plan).toContain("Mission Start (After Sanitize)");
		expect(plan).toContain("DCS installation directory");
	});

	test("generates comprehensive plan with all components", () => {
		const release: ModReleaseData = {
			id: "test-release-9",
			mod_id: "test-mod-1",
			version: "2.0.0",
			changelog: "Complete overhaul with all features",
			assets: [
				{
					name: "textures.zip",
					urls: ["https://cdn.example.com/textures.zip"],
					isArchive: true,
				},
				{
					name: "config.lua",
					urls: ["https://cdn.example.com/config.lua"],
					isArchive: false,
				},
			],
			symbolicLinks: [
				{
					src: "/textures",
					dest: "/Mods/MyMod/Textures",
					destRoot: SymbolicLinkDestRoot.DCS_INSTALL_DIR,
				},
				{
					src: "/scripts",
					dest: "/Scripts/MyMod",
					destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				},
			],
			missionScripts: [
				{
					path: "Scripts/Hooks/MyModHook.lua",
					root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
					runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
				},
			],
			visibility: ModVisibility.Public,
		};

		const plan = generateExplainPlan(release);

		// Check all sections exist
		expect(plan).toContain("Installation Plan for Release 2.0.0");
		expect(plan).toContain("Complete overhaul");
		expect(plan).toContain("Assets");
		expect(plan).toContain("Symbolic Links");
		expect(plan).toContain("Mission Scripts");
		expect(plan).toContain("Summary");

		// Check summary counts
		expect(plan).toContain("2 assets will be downloaded");
		expect(plan).toContain("1 archive will be extracted");
		expect(plan).toContain("2 symbolic links will be created");
		expect(plan).toContain("1 mission script will be installed");
	});

	test("handles long changelog with truncation", () => {
		const longChangelog = "A".repeat(300);
		const release: ModReleaseData = {
			id: "test-release-10",
			mod_id: "test-mod-1",
			version: "1.7.0",
			changelog: longChangelog,
			assets: [],
			symbolicLinks: [],
			missionScripts: [],
			visibility: ModVisibility.Public,
		};

		const plan = generateExplainPlan(release);

		expect(plan).toContain("...");
		expect(plan.length).toBeLessThan(longChangelog.length + 1000);
	});

	test("handles plural forms correctly", () => {
		const release: ModReleaseData = {
			id: "test-release-11",
			mod_id: "test-mod-1",
			version: "3.0.0",
			changelog: "Multiple items test",
			assets: [
				{ name: "file1.zip", urls: ["http://ex.com/1"], isArchive: true },
				{ name: "file2.zip", urls: ["http://ex.com/2"], isArchive: true },
				{ name: "file3.lua", urls: ["http://ex.com/3"], isArchive: false },
			],
			symbolicLinks: [
				{
					src: "/a",
					dest: "/b",
					destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				},
				{
					src: "/c",
					dest: "/d",
					destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				},
				{
					src: "/e",
					dest: "/f",
					destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				},
			],
			missionScripts: [
				{
					path: "/s1",
					root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
					runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
				},
				{
					path: "/s2",
					root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
					runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
				},
			],
			visibility: ModVisibility.Public,
		};

		const plan = generateExplainPlan(release);

		expect(plan).toContain("3 assets will be downloaded");
		expect(plan).toContain("2 archives will be extracted");
		expect(plan).toContain("3 symbolic links will be created");
		expect(plan).toContain("2 mission scripts will be installed");
	});

	test("handles empty changelog", () => {
		const release: ModReleaseData = {
			id: "test-release-12",
			mod_id: "test-mod-1",
			version: "1.0.1",
			changelog: "",
			assets: [{ name: "file.lua", urls: ["http://ex.com"], isArchive: false }],
			symbolicLinks: [],
			missionScripts: [],
			visibility: ModVisibility.Public,
		};

		const plan = generateExplainPlan(release);

		expect(plan).toContain("Installation Plan for Release 1.0.1");
		expect(plan).not.toContain("Release Notes");
	});

	test("escapes HTML and markdown special characters to prevent XSS", () => {
		const release: ModReleaseData = {
			id: "test-release-xss",
			mod_id: "test-mod-1",
			version: '1.0.0"><script>alert("XSS")</script>',
			changelog: '<img src=x onerror=alert("XSS")>',
			assets: [
				{
					name: 'malicious[test](javascript:alert("XSS"))',
					urls: ["http://ex.com"],
					isArchive: false,
				},
			],
			symbolicLinks: [
				{
					src: "/path<script>alert('XSS')</script>",
					dest: "/dest`alert('XSS')`",
					destRoot: SymbolicLinkDestRoot.DCS_WORKING_DIR,
				},
			],
			missionScripts: [
				{
					path: "script<img src=x onerror=alert('XSS')>.lua",
					root: SymbolicLinkDestRoot.DCS_WORKING_DIR,
					runOn: MissionScriptRunOn.MISSION_START_BEFORE_SANITIZE,
				},
			],
			visibility: ModVisibility.Public,
		};

		const plan = generateExplainPlan(release);

		// Verify HTML entities are escaped - this prevents XSS execution
		expect(plan).toContain("&lt;");
		expect(plan).toContain("&gt;");
		expect(plan).toContain("&quot;");
		expect(plan).toContain("&#039;");

		// Verify markdown link syntax is escaped
		expect(plan).toContain("\\[");
		expect(plan).toContain("\\]");

		// Verify backticks are escaped
		expect(plan).toContain("\\`");

		// Verify raw unescaped script tags are NOT present (key XSS prevention)
		expect(plan).not.toContain("<script>");
		expect(plan).not.toContain("</script>");

		// The escaped versions should be present (safe to display)
		expect(plan).toContain("&lt;script&gt;");
		expect(plan).toContain("&lt;/script&gt;");
	});
});

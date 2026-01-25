import * as assert from "node:assert";
import { platform } from "node:os";
import { join } from "node:path";
import { string } from "getenv";
import { SEVEN_ZIP_BINARIES, WGET_BINARIES } from "../constants.ts";
import { which } from "../utils/which.ts";
import type { ConfigSchema } from "./configSchema.ts";

export const DROPZONE_DAEMON_WORKING_DIR = string("DCS_DROPZONE__WORKING_DIR", process.cwd());
export const DROPZONE_DAEMON_INSTALL_DIR = string("DCS_DROPZONE__INSTALL_DIR", DROPZONE_DAEMON_WORKING_DIR);

export const CONFIG_FILE_PATH: string = join(DROPZONE_DAEMON_WORKING_DIR, "config.json");

const DCS_WORKING_DIR = join(string("USERPROFILE") || "", "Saved Games", "DCS");
const DCS_INSTALL_DIR = join(string("PROGRAMFILES"), "Eagle Dynamics", "DCS World");

const DATABASE_URL = join(DROPZONE_DAEMON_WORKING_DIR, "data.sqlite");
const MODS_DIR = join(DROPZONE_DAEMON_WORKING_DIR, "data");

const WGET_PATH =
	platform() === "win32"
		? join(DROPZONE_DAEMON_INSTALL_DIR, "bin", "wget.exe")
		: WGET_BINARIES.map(which).find(Boolean);

const SEVEN_ZIP_PATH =
	platform() === "win32"
		? join(DROPZONE_DAEMON_INSTALL_DIR, "bin", "7za.exe")
		: SEVEN_ZIP_BINARIES.map(which).find(Boolean);

assert.ok(WGET_PATH);
assert.ok(SEVEN_ZIP_PATH);

export const defaultConfig: ConfigSchema = {
	server: {
		host: "127.0.0.1",
		port: 3001,
	},
	database: {
		url: DATABASE_URL,
	},
	binaries: {
		wget: WGET_PATH,
		sevenzip: SEVEN_ZIP_PATH,
	},
	app: {
		mods_dir: MODS_DIR,
		webapp_url: "https://dcs-dropzone-container.flying-dice.workers.dev/",
	},
	dcs: {
		dcs_working_dir: DCS_WORKING_DIR,
		dcs_install_dir: DCS_INSTALL_DIR,
	},
};

import { join } from "node:path";

export const WGET_BINARIES = ["wget"];
export const SEVEN_ZIP_BINARIES = ["7z", "7za", "7zz"];
export const MISSION_START_BEFORE_SANITIZE = join("Scripts", "DropzoneMissionScriptsBeforeSanitize.lua");
export const MISSION_START_AFTER_SANITIZE = join("Scripts", "DropzoneMissionScriptsAfterSanitize.lua");

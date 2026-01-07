import { configure } from "log4js";

configure({
	appenders: {
		// stdout: { type: "stdout" },
		file: { type: "file", filename: "./logs/__tests__.daemon.log", flags: "w" },
	},
	categories: {
		default: { appenders: ["file"], level: "trace" },
	},
});

import { configure } from "log4js";

configure({
	appenders: {
		// stdout: { type: "stdout" },
		file: { type: "file", filename: "./__tests__.log", flags: "w" },
	},
	categories: {
		default: { appenders: ["file"], level: "info" },
	},
});

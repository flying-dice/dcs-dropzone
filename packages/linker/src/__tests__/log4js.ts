import { configure } from "log4js";

configure({
	appenders: {
		file: { type: "file", filename: "./logs/__tests__.linker.log", flags: "w" },
	},
	categories: {
		default: { appenders: ["file"], level: "trace" },
	},
});

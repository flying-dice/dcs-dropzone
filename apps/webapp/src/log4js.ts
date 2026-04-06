import { addLayout, type Configuration, configure, getLogger } from "log4js";

addLayout("json", (_) => {
	return (logEvent) => JSON.stringify(logEvent);
});

try {
	const configPath = process.env.LOG4JS_CONFIG ?? `${process.cwd()}/log4js.yaml`;
	const file = Bun.file(configPath);
	const text = await file.text();
	const config = Bun.YAML.parse(text);

	configure(config as Configuration);
} catch (error) {
	console.error("Failed to configure log4js using file due to:", error);
	console.log("Falling back to default log4js configuration.");
	configure({
		appenders: {
			out: { type: "stdout" },
		},
		categories: {
			default: { appenders: ["out"], level: "debug" },
		},
	});
}

const logger = getLogger("log4js");

logger.info("Log4js has been configured");

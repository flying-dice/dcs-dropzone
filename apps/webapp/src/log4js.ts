import { addLayout, type Configuration, configure, getLogger } from "log4js";
import { ResultAsync } from "neverthrow";

addLayout("json", (_) => {
	return (logEvent) => JSON.stringify(logEvent);
});

await ResultAsync.fromPromise(
	(async () => {
		const file = Bun.file(`${process.cwd()}/log4js.yaml`);
		const text = await file.text();
		return Bun.YAML.parse(text);
	})(),
	(error) => error,
).match(
	(config) => configure(config as Configuration),
	(error) => {
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
	},
);

const logger = getLogger("log4js");

logger.info("Log4js has been configured");

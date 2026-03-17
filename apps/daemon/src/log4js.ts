import { mergeWith } from "lodash";
import { type Configuration, configure, getLogger } from "log4js";

try {
	const file = Bun.file(`${process.cwd()}/log4js.yaml`);
	const text = await file.text();
	const config = <Configuration>Bun.YAML.parse(text);

	configure(mergeWith({}, config));
} catch (_error) {
	console.log("Falling back to default log4js configuration.");
	configure(
		mergeWith({
			appenders: {
				out: { type: "stdout" },
			},
			categories: {
				default: { appenders: ["out"], level: "info" },
			},
		}),
	);
}

const logger = getLogger("log4js");

logger.info("Log4js has been configured");

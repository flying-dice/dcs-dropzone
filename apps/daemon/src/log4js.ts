import { mergeWith } from "lodash";
import { type Configuration, configure, getLogger } from "log4js";
import { ResultAsync } from "neverthrow";

await ResultAsync.fromPromise(
	(async () => {
		const file = Bun.file(`${process.cwd()}/log4js.yaml`);
		const text = await file.text();
		return <Configuration>Bun.YAML.parse(text);
	})(),
	(error) => error,
).match(
	(config) => configure(mergeWith({}, config)),
	(_error) => {
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
	},
);

const logger = getLogger("log4js");

logger.info("Log4js has been configured");

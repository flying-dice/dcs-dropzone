import { pino } from "pino";
import prettyTransport from "pino-pretty";
import appConfig from "./ApplicationConfig.ts";

const transport = prettyTransport({
	colorize: appConfig.logging.colorize,
	destination: appConfig.logging.destination || 1,
});

const rootLogger = pino(
	{
		level: appConfig.logging.level,
		formatters: {
			level: (label) => ({ level: label }),
		},
	},
	transport,
);

export function getLogger(namespace: string) {
	return rootLogger.child({ name: namespace });
}

export default {
	root: rootLogger,
	getLogger,
};

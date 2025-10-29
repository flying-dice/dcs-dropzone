import { pino } from "pino";
import appConfig from "./app-config.ts";

const rootLogger = pino({
	level: appConfig.logLevel,
});

export function getLogger(namespace: string) {
	return rootLogger.child({ name: namespace });
}

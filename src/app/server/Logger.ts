import { pino } from "pino";
import appConfig from "./ApplicationConfig.ts";

const root = pino({
	level: appConfig.logLevel,
});

function getLogger(namespace: string) {
	return root.child({ name: namespace });
}

export default {
	root,
	getLogger,
};

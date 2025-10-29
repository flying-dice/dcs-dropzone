import { pino } from "pino";
import appConfig from "./app-config.ts";

const rootLogger = pino({
  level: appConfig.logging.level,
  formatters: {
    level: (label) => ({ level: label }),
  },
  transport: {
    target: "pino-pretty",
    options: {
      colorize: appConfig.logging.colorize,
      destination: appConfig.logging.destination || 1,
    },
  },
});

export function getLogger(namespace: string) {
  return rootLogger.child({ name: namespace });
}

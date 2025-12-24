import { mergeWith } from "lodash";
import { type AppenderModule, addLayout, type Configuration, configure, getLogger, type LoggingEvent } from "log4js";
import RingBuffer from "ringbufferjs";
import { BehaviorSubject } from "rxjs";

export type RecentLoggingEvent = LoggingEvent & { id: string };

export const recentLoggingEvents = new RingBuffer<RecentLoggingEvent>(200);
export const recentLoggingEvent$ = new BehaviorSubject<RecentLoggingEvent[]>(
	recentLoggingEvents.peekN(recentLoggingEvents.size()),
);

export function clearRecentLoggingEvents() {
	recentLoggingEvents.deqN(recentLoggingEvents.size());
	recentLoggingEvent$.next(recentLoggingEvents.peekN(recentLoggingEvents.size()));
}

const recentAppender: AppenderModule = {
	configure: () => (loggingEvent: LoggingEvent) => {
		const s = recentLoggingEvents.enq({ ...loggingEvent, id: crypto.randomUUID() });
		recentLoggingEvent$.next(recentLoggingEvents.peekN(s));
	},
};

addLayout("json", (_) => {
	return (logEvent) => JSON.stringify(logEvent);
});

const TUI_CONFIG = {
	appenders: {
		recent: { type: recentAppender },
	},
	categories: {
		tui: { appenders: ["recent"], level: "info" },
	},
};

try {
	const file = Bun.file(`${process.cwd()}/log4js.yaml`);
	const text = await file.text();
	const config = <Configuration>Bun.YAML.parse(text);

	configure(mergeWith({}, config, TUI_CONFIG));
} catch (error) {
	console.error("Failed to configure log4js using file due to:", error);
	console.log("Falling back to default log4js configuration.");
	configure(
		mergeWith(
			{
				appenders: {
					out: { type: "stdout" },
				},
				categories: {
					default: { appenders: ["out"], level: "debug" },
				},
			},
			TUI_CONFIG,
		),
	);
}

const logger = getLogger("log4js");

logger.info("Log4js has been configured");

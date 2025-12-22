import {
	type AppenderFunction,
	type AppenderModule,
	addLayout,
	type Config,
	type Configuration,
	configure,
	getLogger,
	type LayoutsParam,
	type Levels,
	type LoggingEvent,
} from "log4js";
import { BehaviorSubject } from "rxjs";

class RecentLogs<T> {
	private readonly limit: number;
	private buffer: (T | undefined)[];
	private size = 0;
	private end = 0;

	constructor(limit: number) {
		this.limit = limit;
		this.buffer = new Array(limit);
	}

	push(entry: T): void {
		this.buffer[this.end] = entry;
		this.end = (this.end + 1) % this.limit;
		if (this.size < this.limit) this.size++;
	}

	pop(): T | undefined {
		if (this.size === 0) return undefined;
		this.end = (this.end - 1 + this.limit) % this.limit;
		const value = this.buffer[this.end];
		this.buffer[this.end] = undefined;
		this.size--;
		return value;
	}

	peek(): T | undefined {
		if (this.size === 0) return undefined;
		return this.buffer[(this.end - 1 + this.limit) % this.limit];
	}

	/** Newest → oldest */
	newestFirst(): T[] {
		const result: T[] = [];
		for (let i = 0; i < this.size; i++) {
			const idx = (this.end - 1 - i + this.limit * 10) % this.limit;
			const val = this.buffer[idx];
			if (val !== undefined) result.push(val);
		}
		return result;
	}

	sizeOf(): number {
		return this.size;
	}
}

export type RecentLoggingEvent = LoggingEvent & { id: string };

export const recentLoggingEvents = new RecentLogs<RecentLoggingEvent>(20);
export const recentLoggingEvent$ = new BehaviorSubject<RecentLoggingEvent[]>(recentLoggingEvents.newestFirst());

const recentAppender: AppenderModule = {
	configure:
		(config?: Config, layouts?: LayoutsParam, findAppender?: () => AppenderFunction, levels?: Levels) =>
		(loggingEvent: LoggingEvent) => {
			recentLoggingEvents.push({ ...loggingEvent, id: crypto.randomUUID() });
			recentLoggingEvent$.next(recentLoggingEvents.newestFirst());
		},
};

addLayout("json", (_) => {
	return (logEvent) => JSON.stringify(logEvent);
});

try {
	const file = Bun.file(`${process.cwd()}/log4js.yaml`);
	const text = await file.text();
	const config = <Configuration>Bun.YAML.parse(text);

	config.appenders._recent = { type: recentAppender };
	config.categories.default?.appenders.push("_recent");

	configure(config);
} catch (error) {
	console.error("Failed to configure log4js using file due to:", error);
	console.log("Falling back to default log4js configuration.");
	configure({
		appenders: {
			recent: { type: recentAppender },
			out: { type: "stdout" },
		},
		categories: {
			default: { appenders: ["out", "recent"], level: "debug" },
		},
	});
}

const logger = getLogger("log4js");

logger.info("Log4js has been configured");

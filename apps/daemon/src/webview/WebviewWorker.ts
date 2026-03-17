import { getLogger } from "log4js";
import { Result } from "neverthrow";
import { MainToWorker, WorkerToMain } from "./messages";

const logger = getLogger("WebviewWorker");

export class WebviewWorker {
	worker: Worker;

	constructor(scriptUrl: string | URL) {
		this.worker = new Worker(scriptUrl);
	}

	terminate() {
		this.worker.terminate();
	}

	postMessage(message: MainToWorker) {
		this.worker.postMessage(MainToWorker.parse(message));
	}

	onMessage(handler: (message: WorkerToMain) => void) {
		this.worker.onmessage = (event: MessageEvent) => {
			const message = event.data;
			Result.fromThrowable(
				() => {
					const parsedMessage = WorkerToMain.parse(message);
					handler(parsedMessage);
				},
				(e) => (e instanceof Error ? e : new Error(String(e))),
			)().mapErr((error) => {
				logger.error("Failed to parse message from worker:", error);
			});
		};
	}

	onError(handler: (error: ErrorEvent) => void) {
		this.worker.onerror = (error: ErrorEvent) => {
			handler(error);
		};
	}
}

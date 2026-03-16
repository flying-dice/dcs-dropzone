import { getLogger } from "log4js";
import { constants } from "../AppConfig.ts";
import { MainToWorker, WorkerToMain } from "./messages";
import { WebviewWorkerEnv, WorkerEnv } from "./WebviewWorkerEnv.ts";

const logger = getLogger("WebviewWorker");

logger.debug("WebviewWorker module path:", constants.WebviewWorkerModulePath);

export type WebviewWorkerOptions = {
	debug?: boolean;
	title?: string;
};

export class WebviewWorker {
	worker: Worker;

	constructor(opts?: WebviewWorkerOptions) {
		this.worker = new Worker(constants.WebviewWorkerModulePath, {
			env: WorkerEnv.parse(
				WebviewWorkerEnv.parse(<WebviewWorkerEnv>{
					__DROPZONE_WEBVIEW_DEBUG: opts?.debug ?? false,
					__DROPZONE_WEBVIEW_TITLE: opts?.title ?? "Dropzone",
				}),
			),
		});
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
			try {
				const parsedMessage = WorkerToMain.parse(message);
				handler(parsedMessage);
			} catch (error) {
				logger.error("Failed to parse message from worker:", error);
			}
		};
	}

	onError(handler: (error: ErrorEvent) => void) {
		this.worker.onerror = (error: ErrorEvent) => {
			handler(error);
		};
	}
}

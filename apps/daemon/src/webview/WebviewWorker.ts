import { getLogger } from "log4js";
import { err, fromThrowable, ok, type Result } from "neverthrow";
import { WebviewWorkerEnv, WorkerEnv } from "./WebviewWorkerEnv.ts";

const logger = getLogger("WebviewWorker");

const MODULE_PATH = process.env.__DROPZONE_WEBVIEW_WORKER_MODULE_PATH ?? "./src/webview/worker.ts";

logger.debug("WebviewWorker module path:", MODULE_PATH);

const spawnWorker = fromThrowable(
	(url: string, debug: boolean) =>
		new Worker(MODULE_PATH, {
			env: WorkerEnv.parse(
				WebviewWorkerEnv.parse(<WebviewWorkerEnv>{
					__DROPZONE_WEBVIEW_URL: url,
					__DROPZONE_WEBVIEW_DEBUG: debug,
					__DROPZONE_WEBVIEW_TITLE: "DCS Dropzone | Library",
				}),
			),
		}),
	(e): "failed_to_spawn_worker" => {
		logger.error(String(e));
		return "failed_to_spawn_worker";
	},
);

export type WebviewWorkerOptions = {
	debug?: boolean;
};

export class WebviewWorker {
	private instances: Map<string, Worker> = new Map();

	public open(url: string, options: WebviewWorkerOptions) {
		if (this.instances.has(url)) return ok("exists");

		const result: Result<Worker, "failed_to_spawn_worker"> = spawnWorker(url, options.debug ?? false);

		return result.match(
			(worker) => {
				this.instances.set(url, worker);
				logger.info(`WebviewWorker: Opened new webview for URL: ${url}`);
				return ok("new");
			},
			(error) => {
				logger.error(`WebviewWorker: Failed to open webview for URL: ${url}. Error: ${error}`);
				return err(error);
			},
		);
	}

	public terminate(url: string) {
		try {
			const worker = this.instances.get(url);
			if (worker) {
				worker.terminate();
				this.instances.delete(url);
				logger.info(`WebviewWorker: Terminated webview for URL: ${url}`);
				return ok("terminated");
			} else {
				return ok("no_worker");
			}
		} catch (error) {
			logger.error(`WebviewWorker: Failed to terminate webview for URL: ${url}. Error: ${String(error)}`);
			return err("failed_to_terminate");
		}
	}
}

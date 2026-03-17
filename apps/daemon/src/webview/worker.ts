import { Webview } from "webview-bun";
import { appConfig } from "../AppConfig.ts";
import { WindowClosed } from "./messages/WindowClosed.ts";

declare var self: Worker;

const webview = new Webview(appConfig.enableWebviewWorkerDebug);
webview.title = appConfig.webviewWindowTitle;

const url = new URL(appConfig.daemonUrl);
url.searchParams.set("nocache", Date.now().toString());

console.log(`Webview worker navigating to: ${url.toString()}`);
webview.navigate(url.toString());

try {
	webview.run();
} catch (e) {
	console.error("Error running webview:", e);
}

postMessage(WindowClosed.parse(<WindowClosed>{ type: "window-closed" }));

import { constants } from "@packages/dzui";
import { Webview } from "webview-bun";
import { WindowClosed } from "./messages/WindowClosed.ts";
import { WebviewWorkerEnv } from "./WebviewWorkerEnv.ts";

declare var self: Worker;

const { __DROPZONE_WEBVIEW_DEBUG, __DROPZONE_WEBVIEW_TITLE } = WebviewWorkerEnv.parse(process.env); // Injected by apps/daemon/src/webview/WebviewWorker.ts during construction

const webview = new Webview(__DROPZONE_WEBVIEW_DEBUG);
webview.title = __DROPZONE_WEBVIEW_TITLE;
const url = new URL(constants.DAEMON_URL);
url.searchParams.set("nocache", Date.now().toString());
webview.navigate(url.toString());

webview.run();

postMessage(WindowClosed.parse(<WindowClosed>{ type: "window-closed" }));

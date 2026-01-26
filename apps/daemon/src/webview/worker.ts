import { Webview } from "webview-bun";
import { STORAGE_KEY_WEBAPP_URL, STORAGE_KEY_WEBVIEW_URL } from "../wui/constants.ts";
import { WindowClosed } from "./messages/WindowClosed.ts";
import { WebviewWorkerEnv } from "./WebviewWorkerEnv.ts";

declare var self: Worker;

const index = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Title</title>
</head>
<body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; font-size: 24px; color: #8a8a8a;">
    Loading...
</body>
</html>
`;

const { __DROPZONE_WEBVIEW_DEBUG, __DROPZONE_WEBVIEW_URL, __DROPZONE_WEBAPP_URL, __DROPZONE_WEBVIEW_TITLE } =
	WebviewWorkerEnv.parse(process.env); // Injected by apps/daemon/src/webview/WebviewWorker.ts during construction

const webview = new Webview(__DROPZONE_WEBVIEW_DEBUG);
webview.title = __DROPZONE_WEBVIEW_TITLE;
webview.setHTML(index);
webview.navigate(__DROPZONE_WEBVIEW_URL);

webview.eval(
	`localStorage.setItem(${JSON.stringify(STORAGE_KEY_WEBVIEW_URL)}, ${JSON.stringify(__DROPZONE_WEBVIEW_URL)})`,
);
webview.eval(
	`localStorage.setItem(${JSON.stringify(STORAGE_KEY_WEBAPP_URL)}, ${JSON.stringify(__DROPZONE_WEBAPP_URL)})`,
);

webview.run();

postMessage(WindowClosed.parse(<WindowClosed>{ type: "window-closed" }));

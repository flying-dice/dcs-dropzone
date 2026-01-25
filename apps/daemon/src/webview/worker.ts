import { Webview } from "webview-bun";
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
	WebviewWorkerEnv.parse(process.env);

const webview = new Webview(__DROPZONE_WEBVIEW_DEBUG);
webview.title = __DROPZONE_WEBVIEW_TITLE;
webview.setHTML(index);
webview.navigate(__DROPZONE_WEBVIEW_URL);

declare global {
	interface Window {
		/**
		 * The URL of the Dropzone webview.
		 * This is the Local URL which is initially loaded in the webview.
		 */
		_dropzoneWebviewUrl: string;

		/**
		 * The URL of the Dropzone web application.
		 * This is the Public URL where the Dropzone web application is hosted.
		 * Used for navigation from the webview to the main web application.
		 */
		_dropzoneWebappUrl: string;
	}
}

webview.eval(`window._dropzoneWebviewUrl = "${__DROPZONE_WEBVIEW_URL}"`);
webview.eval(`window._dropzoneWebappUrl = "${__DROPZONE_WEBAPP_URL}"`);

webview.run();

postMessage(WindowClosed.parse(<WindowClosed>{ type: "window-closed" }));

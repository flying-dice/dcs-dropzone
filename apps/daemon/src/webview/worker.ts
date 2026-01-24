import { Webview } from "webview-bun";
import { WebviewWorkerEnv } from "./WebviewWorkerEnv.ts";

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

const { __DROPZONE_WEBVIEW_DEBUG, __DROPZONE_WEBVIEW_URL, __DROPZONE_WEBVIEW_TITLE } = WebviewWorkerEnv.parse(
	process.env,
);

const webview = new Webview(__DROPZONE_WEBVIEW_DEBUG);
webview.title = __DROPZONE_WEBVIEW_TITLE;
webview.setHTML(index);
webview.navigate(__DROPZONE_WEBVIEW_URL);
webview.run();

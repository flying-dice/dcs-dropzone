import { useLocalStorage } from "@mantine/hooks";
import { ColorSchemeControls, DzAppShell } from "@packages/dzui";
import { STORAGE_KEY_WEBAPP_URL, STORAGE_KEY_WEBVIEW_URL } from "./constants.ts";
import { DownloadedPage } from "./pages/DaemonPage";

export function App() {
	const [webviewUrl] = useLocalStorage<string | null>({
		key: STORAGE_KEY_WEBVIEW_URL,
		defaultValue: null,
	});

	const [webappUrl] = useLocalStorage<string | null>({
		key: STORAGE_KEY_WEBAPP_URL,
		defaultValue: null,
	});

	return (
		<DzAppShell
			variant={"daemon"}
			webappUrl={webappUrl || "https://dcs-dropzone-container.flying-dice.workers.dev/"}
			webviewUrl={webviewUrl || "http://127.0.0.1:3001/"}
			headerSection={<ColorSchemeControls lightLabel={"Light"} autoLabel={"Auto"} darkLabel={"Dark"} />}
		>
			<DownloadedPage />
		</DzAppShell>
	);
}

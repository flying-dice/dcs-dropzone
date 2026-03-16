import { ColorSchemeControls, DzAppShell } from "@packages/dzui";
import { DownloadedPage } from "./pages/DaemonPage";

export function App() {
	return (
		<DzAppShell
			variant={"daemon"}
			headerSection={<ColorSchemeControls lightLabel={"Light"} autoLabel={"Auto"} darkLabel={"Dark"} />}
			webappUrl={"http://localhost:3000"}
			daemonUrl={"http://localhost:3001"}
		>
			<DownloadedPage />
		</DzAppShell>
	);
}

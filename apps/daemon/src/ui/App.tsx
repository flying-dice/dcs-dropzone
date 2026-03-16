import { useGetConfig } from "@packages/clients/daemon";
import { ColorSchemeControls, DzAppShell } from "@packages/dzui";
import { DownloadedPage } from "./pages/DaemonPage";

export function App() {
	const config = useGetConfig();

	return (
		<DzAppShell
			variant={"daemon"}
			headerSection={<ColorSchemeControls lightLabel={"Light"} autoLabel={"Auto"} darkLabel={"Dark"} />}
			webappUrl={config.data?.data.webappUrl || ""}
			daemonUrl={config.data?.data.daemonUrl || ""}
		>
			<DownloadedPage />
		</DzAppShell>
	);
}

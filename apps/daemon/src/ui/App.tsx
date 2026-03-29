import { useGetConfig } from "@packages/clients/daemon";
import { ColorSchemeControls, DzAppShell } from "@packages/dzui";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { DownloadedPage } from "./pages/DaemonPage";
import { SettingsPage } from "./pages/SettingsPage";

function AppRoutes() {
	const config = useGetConfig();
	const location = useLocation();
	const variant = location.pathname === "/settings" ? "settings" : "daemon";

	return (
		<DzAppShell
			variant={variant}
			headerSection={<ColorSchemeControls lightLabel={"Light"} autoLabel={"Auto"} darkLabel={"Dark"} />}
			webappUrl={config.data?.data.webappUrl || ""}
			daemonUrl={config.data?.data.daemonUrl || ""}
		>
			<Routes>
				<Route path="/settings" element={<SettingsPage />} />
				<Route path="*" element={<DownloadedPage />} />
			</Routes>
		</DzAppShell>
	);
}

export function App() {
	return (
		<HashRouter>
			<AppRoutes />
		</HashRouter>
	);
}

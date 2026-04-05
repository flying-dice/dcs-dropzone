import { useGetConfig, useGetSettingsValidation } from "@packages/clients/daemon";
import { ColorSchemeControls, DzAppShell, SettingsRequiredDialog } from "@packages/dzui";
import { HashRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { DownloadedPage } from "./pages/DaemonPage";
import { SettingsPage } from "./pages/SettingsPage";

function AppRoutes() {
	const config = useGetConfig();
	const location = useLocation();
	const navigate = useNavigate();
	const validation = useGetSettingsValidation();
	const variant = location.pathname === "/settings" ? "settings" : "daemon";

	const settingsInvalid = validation.data?.data.valid === false;

	return (
		<DzAppShell
			variant={variant}
			headerSection={<ColorSchemeControls lightLabel={"Light"} autoLabel={"Auto"} darkLabel={"Dark"} />}
			webappUrl={config.data?.data.webappUrl || ""}
			daemonUrl={config.data?.data.daemonUrl || ""}
		>
			<SettingsRequiredDialog opened={settingsInvalid} onOpenSettings={() => navigate("/settings")} />
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

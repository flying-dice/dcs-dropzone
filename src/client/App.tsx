import "./index.css";
import { AppShell } from "@mantine/core";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AppHeader } from "./AppHeader.tsx";
import { AppNavbar } from "./AppNavbar.tsx";
import { useUserContext } from "./context/UserContext.ts";
import { Homepage } from "./pages/HomePage.tsx";
import { ModsPage } from "./pages/ModsPage.tsx";

export function App() {
	const { user } = useUserContext();

	return (
		<AppShell header={{ height: 80 }} navbar={{ breakpoint: 0, width: 256 }}>
			<HashRouter>
				<AppHeader />
				<AppNavbar />
				<Routes>
					<Route path="/" element={<Homepage />} />
					<Route path={"/mods"} element={<ModsPage />} />
				</Routes>
			</HashRouter>
		</AppShell>
	);
}

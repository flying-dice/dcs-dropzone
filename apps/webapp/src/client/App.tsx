import "./index.css";
import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AppHeader } from "./AppHeader.tsx";
import { AppNavbar } from "./AppNavbar.tsx";
import { useUserContext } from "./context/UserContext.ts";
import { DownloadedPage } from "./pages/DownloadedPage";
import { Homepage } from "./pages/HomePage";
import { ModPage } from "./pages/ModPage";
import { ModsPage } from "./pages/ModsPage";
import { UserModPage } from "./pages/UserModPage";
import { UserModReleasePage } from "./pages/UserModReleasePage";
import { UserModsPage } from "./pages/UserModsPage";

export function App() {
	const { user } = useUserContext();
	const navbar = useDisclosure();

	return (
		<AppShell
			header={{ height: 80 }}
			navbar={{
				breakpoint: "md",
				width: 256,
				collapsed: { mobile: !navbar[0] },
			}}
		>
			<HashRouter>
				<AppHeader navbar={navbar} />
				<AppNavbar withMyMods={user !== null} />
				<Routes>
					<Route path="/" element={<Homepage />} />
					<Route path={"/mods"} element={<ModsPage />} />
					<Route path={"/mods/:modId"} element={<ModPage />} />
					<Route path={"/downloaded"} element={<DownloadedPage variant={"downloads"} />} />
					<Route path={"/enabled"} element={<DownloadedPage variant={"enabled"} />} />
					<Route path={"/updates"} element={<DownloadedPage variant={"updates"} />} />

					{user && (
						<>
							<Route path={"/user-mods"} element={<UserModsPage user={user} />} />
							<Route path={"/user-mods/:modId"} element={<UserModPage user={user} />} />
							<Route path={"/user-mods/:modId/releases/:releaseId"} element={<UserModReleasePage user={user} />} />
						</>
					)}
				</Routes>
			</HashRouter>
		</AppShell>
	);
}

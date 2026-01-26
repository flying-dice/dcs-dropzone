import { Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ColorSchemeControls, DzAppShell, useAppTranslation } from "@packages/dzui";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AppNavbar } from "./AppNavbar.tsx";
import { AssetActivity } from "./components/AssetActivity.tsx";
import { ProfileMenu } from "./components/ProfileMenu.tsx";
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
	const navbarDisclosure = useDisclosure();
	const { t } = useAppTranslation();

	return (
		<HashRouter>
			<DzAppShell
				variant={"webapp"}
				webappUrl={"/"}
				webviewUrl={"http://127.0.0.1:3001/"}
				navbar={{
					breakpoint: "xs",
					width: 256,
					collapsed: { mobile: !navbarDisclosure[0] },
				}}
				headerSection={
					<Group>
						<AssetActivity />
						<ColorSchemeControls lightLabel={t("LIGHT")} autoLabel={t("AUTO")} darkLabel={t("DARK")} />
						<ProfileMenu />
					</Group>
				}
				navbarDisclosure={navbarDisclosure}
			>
				<AppNavbar withMyMods={user !== null} />
				<Routes>
					<Route path="/" element={<Homepage />} />
					<Route path={"/mods"} element={<ModsPage />} />
					<Route path={"/mods/:modId/:releaseId"} element={<ModPage />} />
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
			</DzAppShell>
		</HashRouter>
	);
}

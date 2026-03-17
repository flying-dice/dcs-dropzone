import { Anchor, Container, Group, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useGetConfig } from "@packages/clients/webapp";
import { AppIcons, ColorSchemeControls, DzAppShell, DzMain, ErrorState, useAppTranslation } from "@packages/dzui";
import { HashRouter, Route, Routes, useNavigate } from "react-router-dom";
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

function FallbackError() {
	const { t } = useAppTranslation();
	const navigate = useNavigate();

	return (
		<DzMain>
			<Container p={"md"}>
				<Stack align={"center"} gap={0}>
					<ErrorState
						withoutBorder
						title={t("ROUTER_ERROR_TITLE")}
						description={t("ROUTER_ERROR_DESC")}
						icon={AppIcons.Error}
					/>
					<Anchor size={"sm"} onClick={() => navigate(-1)}>
						{t("GO_BACK")}
					</Anchor>
				</Stack>
			</Container>
		</DzMain>
	);
}

export function App() {
	const { user } = useUserContext();
	const navbarDisclosure = useDisclosure();
	const { t } = useAppTranslation();
	const config = useGetConfig();

	return (
		<HashRouter>
			<DzAppShell
				webappUrl={config.data?.data.webappUrl ?? ""}
				daemonUrl={config.data?.data.daemonUrl ?? ""}
				variant={"webapp"}
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

					<Route path={"*"} element={<FallbackError />} />
				</Routes>
			</DzAppShell>
		</HashRouter>
	);
}

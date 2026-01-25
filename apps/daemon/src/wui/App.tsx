import { AppShell, Divider, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { AppIcons, ColorSchemeControls, DzHeader, DzNavLink, useAppTranslation } from "@packages/dzui";
import { DownloadedPage } from "./pages/DaemonPage";

export function App() {
	const navbar = useDisclosure();
	const { t } = useAppTranslation();

	return (
		<AppShell
			header={{
				height: 80,
			}}
			navbar={{
				breakpoint: "md",
				width: 256,
				collapsed: { mobile: !navbar[0] },
			}}
		>
			<DzHeader>
				<ColorSchemeControls lightLabel={"Light"} autoLabel={"Auto"} darkLabel={"Dark"} />
			</DzHeader>
			<AppShell.Navbar>
				<Stack p={"md"} gap={"xl"}>
					<Stack gap={"xs"}>
						<DzNavLink
							icon={AppIcons.Daemon}
							active
							label={t("DAEMON")}
							onClick={() => window.open(window._dropzoneWebviewUrl, "_self")}
						/>
						<Divider />

						<DzNavLink
							icon={AppIcons.Home}
							label={t("DASHBOARD")}
							onClick={() => window.open(window._dropzoneWebappUrl, "_self")}
						/>
					</Stack>
				</Stack>
			</AppShell.Navbar>
			<DownloadedPage />
		</AppShell>
	);
}

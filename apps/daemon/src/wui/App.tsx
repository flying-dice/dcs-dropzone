import { AppShell, Divider, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { AppIcons, ColorSchemeControls, DzHeader, DzNavLink, useAppTranslation } from "@packages/dzui";
import { useEffect, useState } from "react";
import { DownloadedPage } from "./pages/DaemonPage";

export function App() {
	const navbar = useDisclosure();
	const { t } = useAppTranslation();
	const [webviewUrlAvailable, setWebviewUrlAvailable] = useState(false);
	const [webappUrlAvailable, setWebappUrlAvailable] = useState(false);

	useEffect(() => {
		const webviewUrl = localStorage.getItem("_dropzoneWebviewUrl");
		const webappUrl = localStorage.getItem("_dropzoneWebappUrl");
		setWebviewUrlAvailable(webviewUrl !== null);
		setWebappUrlAvailable(webappUrl !== null);
	}, []);

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
							disabled={!webviewUrlAvailable}
							onClick={() => {
								const url = localStorage.getItem("_dropzoneWebviewUrl");
								if (url) {
									window.open(url, "_self");
								} else {
									console.warn("Webview URL not found in localStorage");
								}
							}}
						/>
						<Divider />

						<DzNavLink
							icon={AppIcons.Home}
							label={t("DASHBOARD")}
							disabled={!webappUrlAvailable}
							onClick={() => {
								const url = localStorage.getItem("_dropzoneWebappUrl");
								if (url) {
									window.open(url, "_self");
								} else {
									console.warn("Webapp URL not found in localStorage");
								}
							}}
						/>
					</Stack>
				</Stack>
			</AppShell.Navbar>
			<DownloadedPage />
		</AppShell>
	);
}

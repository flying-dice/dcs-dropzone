import { AppShell, Divider, Stack } from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { AppIcons, ColorSchemeControls, DzHeader, DzNavLink, useAppTranslation } from "@packages/dzui";
import { DownloadedPage } from "./pages/DaemonPage";

const STORAGE_KEY_WEBVIEW_URL = "_dropzoneWebviewUrl";
const STORAGE_KEY_WEBAPP_URL = "_dropzoneWebappUrl";

export function App() {
	const navbar = useDisclosure();
	const { t } = useAppTranslation();
	const [webviewUrl] = useLocalStorage<string | null>({
		key: STORAGE_KEY_WEBVIEW_URL,
		defaultValue: null,
	});
	const [webappUrl] = useLocalStorage<string | null>({
		key: STORAGE_KEY_WEBAPP_URL,
		defaultValue: null,
	});

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
							disabled={!webviewUrl}
							onClick={() => {
								if (webviewUrl) {
									window.open(webviewUrl, "_self");
								} else {
									console.warn("Webview URL not found in localStorage");
								}
							}}
						/>
						<Divider />

						<DzNavLink
							icon={AppIcons.Home}
							label={t("DASHBOARD")}
							disabled={!webappUrl}
							onClick={() => {
								if (webappUrl) {
									window.open(webappUrl, "_self");
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

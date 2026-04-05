import { AppShell, Divider, Stack, Text } from "@mantine/core";
import { type ModDataCategory, useGetCategories } from "@packages/clients/webapp";
import type { I18nKeys } from "@packages/dzui";
import { AppIcons, CategoryShortcut, DzNavLink, useAppTranslation } from "@packages/dzui";
import { useLocation, useNavigate } from "react-router-dom";
import {
	BROWSE_MODS_BUTTON_TEST_ID,
	DASHBOARD_BUTTON_TEST_ID,
	DOWNLOADED_BUTTON_TEST_ID,
	ENABLED_BUTTON_TEST_ID,
	MY_MODS_BUTTON_TEST_ID,
	UPDATES_BUTTON_TEST_ID,
} from "../../../../playwright.constants.ts";
import { useDaemon } from "./hooks/useDaemon";

export type AppNavbarProps = {
	withMyMods: boolean;
};
export function AppNavbar(props: AppNavbarProps) {
	const { t } = useAppTranslation();
	const categories = useGetCategories();
	const nav = useNavigate();

	const handleClick = (category: ModDataCategory) => {
		const params = new URLSearchParams();
		params.append("category", category);
		nav({
			pathname: "/mods",
			search: params.toString(),
		});
	};

	const { metrics } = useDaemon();

	const location = useLocation();

	return (
		<AppShell.Navbar>
			<Stack p={"md"} gap={"xl"}>
				<Stack gap={"xs"}>
					<DzNavLink
						data-testid={DASHBOARD_BUTTON_TEST_ID}
						icon={AppIcons.Home}
						label={t("DASHBOARD")}
						active={location.pathname === "/"}
						onClick={() => nav("/")}
					/>

					<DzNavLink
						data-testid={BROWSE_MODS_BUTTON_TEST_ID}
						icon={AppIcons.Mods}
						label={t("BROWSE_MODS")}
						active={location.pathname === "/mods"}
						onClick={() => nav("/mods")}
					/>

					<DzNavLink
						data-testid={MY_MODS_BUTTON_TEST_ID}
						disabled={!props.withMyMods}
						icon={AppIcons.UserMods}
						label={t("MY_MODS")}
						active={location.pathname === "/user-mods"}
						onClick={() => nav("/user-mods")}
					/>

					<Divider label={t("LIBRARY")} labelPosition={"center"} />

					<DzNavLink
						data-testid={DOWNLOADED_BUTTON_TEST_ID}
						icon={AppIcons.Downloaded}
						label={t("DOWNLOADED")}
						active={location.pathname === "/downloaded"}
						count={metrics.value?.downloads}
						disabled={metrics.value?.downloads === undefined}
						onClick={() => nav("/downloaded")}
					/>
					<DzNavLink
						data-testid={ENABLED_BUTTON_TEST_ID}
						icon={AppIcons.Enabled}
						label={t("ENABLED")}
						count={metrics.value?.enabled}
						disabled={metrics.value?.enabled === undefined}
						countColor={"green"}
						active={location.pathname === "/enabled"}
						onClick={() => nav("/enabled")}
					/>
					<DzNavLink
						data-testid={UPDATES_BUTTON_TEST_ID}
						icon={AppIcons.Updates}
						label={t("UPDATES")}
						count={metrics.value?.outdated}
						disabled={metrics.value?.outdated === undefined}
						active={location.pathname === "/updates"}
						onClick={() => nav("/updates")}
					/>
				</Stack>
				<Stack gap="0">
					<Text fw={"bold"} fz={12} c={"gray"} pb={"sm"}>
						{t("CATEGORIES")}
					</Text>
					{Object.entries(categories.data?.data || {})?.map(([category, count]) => (
						<CategoryShortcut
							key={category}
							label={t(category as I18nKeys)}
							count={count}
							onClick={() => handleClick(category as ModDataCategory)}
						/>
					))}
				</Stack>
			</Stack>
		</AppShell.Navbar>
	);
}

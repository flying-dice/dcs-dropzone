import { AppShell, Stack, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { type ModDataCategory, useGetCategories } from "./_autogen/api.ts";
import { CategoryShortcut } from "./components/CategoryShortcut.tsx";
import { NavShortcut } from "./components/NavShortcut.tsx";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics.ts";
import type { I18nKeys } from "./i18n/I18nKeys.ts";
import { useAppTranslation } from "./i18n/useAppTranslation.ts";
import { AppIcons } from "./icons.ts";

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

	const { downloads, enabled, outdated } = useDashboardMetrics();

	console.log({
		downloads,
		enabled,
		outdated,
	});

	return (
		<AppShell.Navbar>
			<Stack p={"md"} gap={"xl"}>
				<Stack gap={"xs"}>
					<NavShortcut icon={AppIcons.Home} label={t("DASHBOARD")} to={"/"} />
					<NavShortcut icon={AppIcons.Mods} label={t("BROWSE_MODS")} to={"/mods"} />
					<NavShortcut icon={AppIcons.Downloaded} label={t("DOWNLOADED")} to={"/downloaded"} count={downloads} />
					<NavShortcut
						icon={AppIcons.Enabled}
						label={t("ENABLED")}
						count={enabled}
						countColor={"green"}
						to={"/enabled"}
					/>
					<NavShortcut
						icon={AppIcons.Updates}
						label={t("UPDATES")}
						count={outdated}
						countColor={"red"}
						to={"/updates"}
					/>
					{props.withMyMods && <NavShortcut icon={AppIcons.UserMods} label={t("MY_MODS")} to={"/user-mods"} />}
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

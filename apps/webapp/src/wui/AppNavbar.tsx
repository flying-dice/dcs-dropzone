import { AppShell, Stack, Text } from "@mantine/core";
import type { I18nKeys } from "@packages/dzui";
import { AppIcons, CategoryShortcut, DzNavLink, useAppTranslation } from "@packages/dzui";
import { useLocation, useNavigate } from "react-router-dom";
import { type ModDataCategory, useGetCategories } from "./_autogen/api.ts";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics.ts";

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

	const m = useDashboardMetrics();

	const location = useLocation();

	return (
		<AppShell.Navbar>
			<Stack p={"md"} gap={"xl"}>
				<Stack gap={"xs"}>
					<DzNavLink
						icon={AppIcons.Mods}
						label={t("BROWSE_MODS")}
						active={location.pathname === "/mods"}
						onClick={() => nav("/mods")}
					/>
					<DzNavLink
						icon={AppIcons.Downloaded}
						label={t("DOWNLOADED")}
						active={location.pathname === "/downloaded"}
						count={m.downloads}
						onClick={() => nav("/downloaded")}
					/>
					<DzNavLink
						icon={AppIcons.Enabled}
						label={t("ENABLED")}
						count={m.enabled}
						countColor={"green"}
						active={location.pathname === "/enabled"}
						onClick={() => nav("/enabled")}
					/>
					<DzNavLink
						icon={AppIcons.Updates}
						label={t("UPDATES")}
						count={m.outdated}
						countColor={"red"}
						active={location.pathname === "/updates"}
						onClick={() => nav("/updates")}
					/>

					{props.withMyMods && (
						<DzNavLink
							icon={AppIcons.UserMods}
							label={t("MY_MODS")}
							active={location.pathname === "/user-mods"}
							onClick={() => nav("/user-mods")}
						/>
					)}
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

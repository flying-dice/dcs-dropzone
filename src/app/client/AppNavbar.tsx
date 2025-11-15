import { AppShell, Stack, Text } from "@mantine/core";
import { CategoryShortcut } from "./components/CategoryShortcut.tsx";
import { NavShortcut } from "./components/NavShortcut.tsx";
import { useAppTranslation } from "./i18n/useAppTranslation.ts";
import { AppIcons } from "./icons.ts";

export type AppNavbarProps = {
	withMyMods: boolean;
};
export function AppNavbar(props: AppNavbarProps) {
	const { t } = useAppTranslation();
	return (
		<AppShell.Navbar>
			<Stack p={"md"} gap={"xl"}>
				<Stack gap={"xs"}>
					<NavShortcut icon={AppIcons.Home} label={t("DASHBOARD")} to={"/"} />
					<NavShortcut
						icon={AppIcons.Mods}
						label={t("BROWSE_MODS")}
						to={"/mods"}
					/>
					<NavShortcut
						icon={AppIcons.Subscribed}
						label={t("SUBSCRIBED")}
						count={42}
					/>
					<NavShortcut
						icon={AppIcons.Enabled}
						label={t("ENABLED")}
						count={12}
						countColor={"green"}
					/>

					<NavShortcut
						icon={AppIcons.Updates}
						label={t("UPDATES")}
						count={3}
						countColor={"red"}
					/>
					{props.withMyMods && (
						<NavShortcut
							icon={AppIcons.UserMods}
							label={t("MY_MODS")}
							to={"/user-mods"}
						/>
					)}
				</Stack>
				<Stack gap="0">
					<Text fw={"bold"} fz={12} c={"gray"} pb={"sm"}>
						{t("CATEGORIES")}
					</Text>
					<CategoryShortcut label={t("AIRCRAFT")} count={156} />
					<CategoryShortcut label={t("MAPS")} count={43} />
					<CategoryShortcut label={t("WEAPONS")} count={89} />
				</Stack>
			</Stack>
		</AppShell.Navbar>
	);
}

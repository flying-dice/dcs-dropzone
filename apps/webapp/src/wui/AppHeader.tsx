import type { UseDisclosureReturnValue } from "@mantine/hooks";
import { ColorSchemeControls, DzHeader } from "@packages/dzui";
import { AssetActivity } from "./components/AssetActivity.tsx";
import { ProfileMenu } from "./components/ProfileMenu.tsx";
import { useAppTranslation } from "./i18n/useAppTranslation.ts";

export type AppHeaderProps = {
	navbar: UseDisclosureReturnValue;
};

export function AppHeader(props: AppHeaderProps) {
	const { t } = useAppTranslation();

	return (
		<DzHeader navbar={props.navbar}>
			<AssetActivity />
			<ColorSchemeControls lightLabel={t("LIGHT")} autoLabel={t("AUTO")} darkLabel={t("DARK")} />
			<ProfileMenu />
		</DzHeader>
	);
}

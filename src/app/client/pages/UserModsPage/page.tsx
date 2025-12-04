import { AppShell, Container, Stack, useComputedColorScheme } from "@mantine/core";
import { modals } from "@mantine/modals";
import type { UserData } from "../../_autogen/api.ts";
import { useGetUserMods } from "../../_autogen/api.ts";
import { NewModForm } from "../../components/NewModForm.tsx";
import { useNewModModal } from "../../hooks/useNewModModal.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import { _UserModsHeader } from "./_UserModsHeader.tsx";
import { _UserModsList } from "./_UserModsList.tsx";
import { _UserModsStats } from "./_UserModsStats.tsx";

export type UserModsPageProps = {
	user: UserData;
};

export function _UserModsPage(_: UserModsPageProps) {
	const { t } = useAppTranslation();
	const colorScheme = useComputedColorScheme();
	const mods = useGetUserMods();

	const { openNewModModal, handleNewModSubmit } = useNewModModal(async () => {
		await mods.refetch();
	});

	const handleNewMod = () => {
		openNewModModal(t("CREATE_NEW_MOD"), <NewModForm onSubmit={handleNewModSubmit} onCancel={modals.closeAll} />);
	};

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"}>
				<Stack py={"md"} gap={"xl"}>
					<_UserModsHeader onNewMod={handleNewMod} />
					<_UserModsStats mods={mods.data} />
					<_UserModsList mods={mods.data} />
				</Stack>
			</Container>
		</AppShell.Main>
	);
}

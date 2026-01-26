import { Container, Stack } from "@mantine/core";
import { modals } from "@mantine/modals";
import { DzMain, useAppTranslation } from "@packages/dzui";
import type { UserData } from "../../_autogen/api.ts";
import { useGetUserMods } from "../../_autogen/api.ts";
import { NewModForm } from "../../components/NewModForm.tsx";
import { useNewModModal } from "../../hooks/useNewModModal.ts";
import { _UserModsHeader } from "./_UserModsHeader.tsx";
import { _UserModsList } from "./_UserModsList.tsx";
import { _UserModsStats } from "./_UserModsStats.tsx";

export type UserModsPageProps = {
	user: UserData;
};

export function _UserModsPage(_: UserModsPageProps) {
	const { t } = useAppTranslation();
	const mods = useGetUserMods();

	const { openNewModModal, handleNewModSubmit } = useNewModModal(async () => {
		await mods.refetch();
	});

	const handleNewMod = () => {
		openNewModModal(t("CREATE_NEW_MOD"), <NewModForm onSubmit={handleNewModSubmit} onCancel={modals.closeAll} />);
	};

	return (
		<DzMain>
			<Container>
				<Stack py={"md"} gap={"xl"}>
					<_UserModsStats />
					<_UserModsHeader onNewMod={handleNewMod} />
					<_UserModsList />
				</Stack>
			</Container>
		</DzMain>
	);
}

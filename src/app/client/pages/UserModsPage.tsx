import { AppShell, Button, Container, Group, Stack, useComputedColorScheme } from "@mantine/core";
import { modals } from "@mantine/modals";
import { StatusCodes } from "http-status-codes";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { match } from "ts-pattern";
import type { UserData } from "../_autogen/api.ts";
import { useGetUserMods } from "../_autogen/api.ts";
import { EmptyState } from "../components/EmptyState.tsx";
import { ModCard } from "../components/ModCard";
import { NewModForm } from "../components/NewModForm.tsx";
import { StatCard } from "../components/StatCard.tsx";
import { useBreakpoint } from "../hooks/useBreakpoint.ts";
import { useNewModModal } from "../hooks/useNewModModal.ts";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";
import { AppIcons } from "../icons.ts";

export type UserModsPageProps = {
	user: UserData;
};

export function UserModsPage(_: UserModsPageProps) {
	const { t } = useAppTranslation();
	const nav = useNavigate();
	const colorScheme = useComputedColorScheme();
	const mods = useGetUserMods();
	const breakpoint = useBreakpoint();

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
					<Group>
						<Button leftSection={<FaPlus />} onClick={handleNewMod}>
							{t("PUBLISH_NEW_MOD")}
						</Button>
					</Group>

					<Group flex={"auto"}>
						<StatCard
							icon={AppIcons.Mods}
							label={t("PUBLISHED_MODS")}
							value={mods.data?.status === StatusCodes.OK ? mods.data.data.meta.published : "-"}
						/>
						<StatCard
							icon={AppIcons.Downloaded}
							iconColor={"grape"}
							label={t("TOTAL_DOWNLOADS")}
							value={mods.data?.status === StatusCodes.OK ? mods.data.data.meta.totalDownloads : "-"}
						/>
					</Group>

					<Stack>
						{match(mods.data)
							.when(
								(res) => res?.status === StatusCodes.OK,
								(res) =>
									res.data.data.map((mod) => (
										<ModCard
											key={mod.id}
											imageUrl={mod.thumbnail}
											category={mod.category}
											title={mod.name}
											summary={mod.description || ""}
											downloads={mod.downloadsCount}
											variant={breakpoint.isXs ? "grid" : "list"}
											onClick={() => nav(mod.id)}
										/>
									)),
							)
							.otherwise(() => (
								<EmptyState
									title={t("NO_USER_MODS_TITLE")}
									description={t("NO_USER_MODS_SUBTITLE_DESC")}
									icon={AppIcons.Mods}
								/>
							))}
					</Stack>
				</Stack>
			</Container>
		</AppShell.Main>
	);
}

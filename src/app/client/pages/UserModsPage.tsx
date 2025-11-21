import {
	AppShell,
	Button,
	Container,
	Group,
	Stack,
	useComputedColorScheme,
} from "@mantine/core";
import { modals, openModal } from "@mantine/modals";
import { StatusCodes } from "http-status-codes";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
	createUserMod,
	type UserData,
	useGetUserMods,
} from "../_autogen/api.ts";
import { ModCard } from "../components/ModCard.tsx";
import { NewModForm } from "../components/NewModForm.tsx";
import { StatCard } from "../components/StatCard.tsx";
import { useBreakpoint } from "../hooks/useBreakpoint.ts";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";
import { AppIcons } from "../icons.ts";
import { showErrorNotification } from "../utils/showErrorNotification.tsx";

export type UserModsPageProps = {
	user: UserData;
};

export function UserModsPage(_: UserModsPageProps) {
	const { t } = useAppTranslation();
	const nav = useNavigate();
	const colorScheme = useComputedColorScheme();
	const mods = useGetUserMods();
	const breakpoint = useBreakpoint();

	const handleNewMod = () => {
		openModal({
			title: t("CREATE_NEW_MOD"),
			size: "xl",
			children: (
				<NewModForm
					onSubmit={async (v) => {
						try {
							const res = await createUserMod(v);
							if (res.status !== StatusCodes.CREATED) {
								throw new Error(`Failed to create mod: ${res.status}`);
							}
							await mods.refetch();
							modals.closeAll();
							nav(res.data.id);
						} catch (e) {
							showErrorNotification(e);
						}
					}}
					onCancel={modals.closeAll}
				/>
			),
		});
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
							value={
								mods.data?.status === StatusCodes.OK
									? mods.data.data.meta.published
									: "-"
							}
						/>
						<StatCard
							icon={AppIcons.Subscribed}
							iconColor={"grape"}
							label={t("TOTAL_SUBSCRIPTIONS")}
							value={
								mods.data?.status === StatusCodes.OK
									? mods.data.data.meta.totalSubscribers
									: "-"
							}
						/>
						<StatCard
							icon={AppIcons.Ratings}
							iconColor={"green"}
							label={t("AVERAGE_RATING")}
							value={
								mods.data?.status === StatusCodes.OK
									? mods.data.data.meta.averageRating.toFixed(2)
									: "-"
							}
						/>
					</Group>

					<Stack>
						{mods.data?.status === StatusCodes.OK &&
							mods.data?.data.data.map((mod) => (
								<ModCard
									key={mod.id}
									imageUrl={mod.thumbnail}
									category={mod.category}
									averageRating={mod.averageRating}
									title={mod.name}
									summary={mod.description || ""}
									subscribers={mod.subscribersCount}
									variant={breakpoint.isXs ? "grid" : "list"}
									onClick={() => nav(mod.id)}
								/>
							))}
					</Stack>
				</Stack>
			</Container>
		</AppShell.Main>
	);
}

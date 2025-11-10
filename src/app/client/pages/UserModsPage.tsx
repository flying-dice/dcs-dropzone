import {
	AppShell,
	Button,
	Container,
	Group,
	SimpleGrid,
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
import { AppIcons } from "../icons.ts";
import { showErrorNotification } from "../utils/showErrorNotification.tsx";

export type UserModsPageProps = {
	user: UserData;
};

export function UserModsPage(_: UserModsPageProps) {
	const nav = useNavigate();
	const colorScheme = useComputedColorScheme();
	const mods = useGetUserMods();

	const handleNewMod = () => {
		openModal({
			title: "Create New Mod",
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
							Publish New Mod
						</Button>
					</Group>

					<SimpleGrid cols={3} spacing={"xl"}>
						<StatCard icon={AppIcons.Mods} label={"Published Mods"} value={3} />
						<StatCard
							icon={AppIcons.Subscribed}
							iconColor={"grape"}
							label={"Total Downloads"}
							value={3}
						/>
						<StatCard
							icon={AppIcons.Ratings}
							iconColor={"green"}
							label={"Average Rating"}
							value={4.8}
						/>
					</SimpleGrid>

					<Stack p={"md"}>
						{mods.data?.status === StatusCodes.OK &&
							mods.data?.data.map((mod) => (
								<ModCard
									key={mod.id}
									imageUrl={mod.thumbnail}
									category={mod.category}
									averageRating={4.8}
									title={mod.name}
									summary={mod.description || ""}
									subscribers={1250}
									variant={"list"}
									onClick={() => nav(mod.id)}
								/>
							))}
					</Stack>
				</Stack>
			</Container>
		</AppShell.Main>
	);
}

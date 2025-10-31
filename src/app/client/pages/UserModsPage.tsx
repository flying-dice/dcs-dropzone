import {
	AppShell,
	Button,
	Container,
	Group,
	noop,
	SimpleGrid,
	Stack,
	Tabs,
	useComputedColorScheme,
} from "@mantine/core";
import { FaPlus } from "react-icons/fa";
import { FaPencil, FaTrash } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import {
	type AuthenticatedUser,
	useGetRegistryIndex,
} from "../_autogen/legacy_api.ts";
import { ModCard } from "../components/ModCard.tsx";
import { StatCard } from "../components/StatCard.tsx";
import { AppIcons } from "../icons.ts";

export type UserModsPageProps = {
	user: AuthenticatedUser;
};

export function UserModsPage(props: UserModsPageProps) {
	const nav = useNavigate();
	const colorScheme = useComputedColorScheme();
	const mods = useGetRegistryIndex();

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"}>
				<Stack py={"md"} gap={"xl"}>
					<Group>
						<Button leftSection={<FaPlus />}>Publish New Mod</Button>
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

					<Stack>
						<Tabs defaultValue="published">
							<Tabs.List>
								<Tabs.Tab value="published">Published</Tabs.Tab>
								<Tabs.Tab value="drafts">Drafts</Tabs.Tab>
							</Tabs.List>

							<Tabs.Panel value="published">
								<Stack p={"md"}>
									{mods.data?.data.map((mod) => (
										<ModCard
											key={mod.id}
											imageUrl={mod.imageUrl}
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
							</Tabs.Panel>

							<Tabs.Panel value="drafts">
								<Stack p={"md"}>
									{mods.data?.data.map((mod) => (
										<ModCard
											key={mod.id}
											imageUrl={mod.imageUrl}
											category={mod.category}
											averageRating={4.8}
											title={mod.name}
											summary={mod.description || ""}
											subscribers={1250}
											isSubscribed={false}
											variant={"list"}
											onClick={() => nav(mod.id)}
										/>
									))}
								</Stack>
							</Tabs.Panel>
						</Tabs>
					</Stack>
				</Stack>
			</Container>
		</AppShell.Main>
	);
}

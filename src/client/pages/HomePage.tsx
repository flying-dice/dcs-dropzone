import {
	AppShell,
	Button,
	Container,
	Group,
	noop,
	SimpleGrid,
	Stack,
	Text,
	useComputedColorScheme,
} from "@mantine/core";
import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useWindowSize } from "react-use";
import { useGetRegistryIndex } from "../_autogen/legacy_api.ts";
import { ModCard } from "../components/ModCard.tsx";
import { StatCard } from "../components/StatCard.tsx";
import { AppIcons } from "../icons.ts";
import { calculateColumns } from "../utils/calculateColumns.ts";

export function Homepage() {
	const nav = useNavigate();
	const colorScheme = useComputedColorScheme();
	const grid = useRef<HTMLDivElement>(null);
	const { width } = useWindowSize();

	const cols = useMemo(
		() => calculateColumns(grid.current?.scrollWidth || 0, 300),
		[width, grid.current?.scrollWidth],
	);

	const mods = useGetRegistryIndex();

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"}>
				<Stack py={"xl"} gap={"xl"}>
					<SimpleGrid cols={4} spacing={"xl"}>
						<StatCard icon={AppIcons.Mods} label={"Total Mods"} value={20} />
						<StatCard
							icon={AppIcons.Subscribed}
							iconColor={"grape"}
							label={"Subscribed"}
							value={3}
						/>
						<StatCard
							icon={AppIcons.Enabled}
							iconColor={"green"}
							label={"Enabled"}
							value={3}
						/>
						<StatCard
							icon={AppIcons.Updates}
							iconColor={"orange"}
							label={"Updates"}
							value={1}
						/>
					</SimpleGrid>
					<Stack>
						<Text fz={"lg"} fw={"bold"}>
							Featured Mods
						</Text>
						<SimpleGrid ref={grid} cols={cols} spacing={"xl"}>
							{mods.data?.data.slice(0, 3).map((mod) => (
								<ModCard
									key={mod.id}
									imageUrl={mod.imageUrl}
									category={mod.category}
									averageRating={4.8}
									title={mod.name}
									summary={mod.description || ""}
									subscribers={1250}
									isSubscribed={false}
									onSubscribeToggle={noop}
									variant={"grid"}
								/>
							))}
						</SimpleGrid>
					</Stack>
					<Stack>
						<Text fz={"lg"} fw={"bold"}>
							Popular mods
						</Text>
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
								onSubscribeToggle={noop}
								variant={"list"}
							/>
						))}
						<Group justify={"center"}>
							<Button
								variant={"default"}
								onClick={async () => {
									await nav("/mods");
								}}
							>
								View all mods
							</Button>
						</Group>
					</Stack>
				</Stack>
			</Container>
		</AppShell.Main>
	);
}

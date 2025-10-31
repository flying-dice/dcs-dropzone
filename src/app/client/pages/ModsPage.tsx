import {
	AppShell,
	Container,
	noop,
	Stack,
	Text,
	useComputedColorScheme,
} from "@mantine/core";
import { useGetRegistryIndex } from "../_autogen/legacy_api.ts";
import { ModCard } from "../components/ModCard.tsx";

export function ModsPage() {
	const colorScheme = useComputedColorScheme();
	const mods = useGetRegistryIndex();

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"}>
				<Stack py={"md"}>
					<Stack>
						<Text fz={"lg"} fw={"bold"}>
							Browse mods
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
								onSubscribeToggle={noop}
								variant={"list"}
							/>
						))}
					</Stack>
				</Stack>
			</Container>
		</AppShell.Main>
	);
}

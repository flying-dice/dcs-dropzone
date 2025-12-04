import { AppShell, Container, Stack, useComputedColorScheme } from "@mantine/core";
import { useGetFeaturedMods, useGetMods } from "../../_autogen/api.ts";
import { useDaemon } from "../../hooks/useDaemon.ts";
import { _FeaturedMods } from "./_FeaturedMods.tsx";
import { _PopularMods } from "./_PopularMods.tsx";
import { _StatsCards } from "./_StatsCards.tsx";

export function _Homepage() {
	const colorScheme = useComputedColorScheme();

	const { downloadCount, enabledCount, outdatedCount } = useDaemon();
	const featuredMods = useGetFeaturedMods();
	const mods = useGetMods({ page: 1, size: 10 });

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"}>
				<Stack py={"xl"} gap={"xl"}>
					<_StatsCards
						totalMods={mods.data}
						downloadCount={downloadCount}
						enabledCount={enabledCount}
						outdatedCount={outdatedCount}
					/>
					<_FeaturedMods featuredMods={featuredMods.data} />
					<_PopularMods popularMods={mods.data} />
				</Stack>
			</Container>
		</AppShell.Main>
	);
}

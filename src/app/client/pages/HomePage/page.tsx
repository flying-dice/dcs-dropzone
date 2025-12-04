import { AppShell, Container, Stack, useComputedColorScheme } from "@mantine/core";
import { useDaemon } from "../../hooks/useDaemon.ts";
import { _FeaturedMods } from "./_FeaturedMods.tsx";
import { _PopularMods } from "./_PopularMods.tsx";
import { _StatsCards } from "./_StatsCards.tsx";

export function _Homepage() {
	const colorScheme = useComputedColorScheme();
	const { downloadCount, enabledCount, outdatedCount } = useDaemon();

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"}>
				<Stack py={"xl"} gap={"xl"}>
					<_StatsCards downloadCount={downloadCount} enabledCount={enabledCount} outdatedCount={outdatedCount} />
					<_FeaturedMods />
					<_PopularMods />
				</Stack>
			</Container>
		</AppShell.Main>
	);
}

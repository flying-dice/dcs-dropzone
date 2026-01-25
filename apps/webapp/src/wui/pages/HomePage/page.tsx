import { Container, Stack } from "@mantine/core";
import { DzMain } from "@packages/dzui";
import { _FeaturedMods } from "./_FeaturedMods.tsx";
import { _PopularMods } from "./_PopularMods.tsx";
import { _StatsCards } from "./_StatsCards.tsx";

export function _Homepage() {
	return (
		<DzMain>
			<Container>
				<Stack py={"md"} gap={"xl"}>
					<_StatsCards />
					<_FeaturedMods />
					<_PopularMods />
				</Stack>
			</Container>
		</DzMain>
	);
}

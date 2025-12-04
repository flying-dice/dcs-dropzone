import { AppShell, Container, Stack, useComputedColorScheme } from "@mantine/core";
import { _DownloadedModsTable } from "./_DownloadedModsTable.tsx";
import { _StatsCards } from "./_StatsCards.tsx";

export type DownloadedPageProps = {
	variant: "downloads" | "enabled" | "updates";
};

export function _DownloadedPage(props: DownloadedPageProps) {
	const colorScheme = useComputedColorScheme();

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"}>
				<Stack py={"xl"} gap={"xl"}>
					<_StatsCards />
					<_DownloadedModsTable variant={props.variant} />
				</Stack>
			</Container>
		</AppShell.Main>
	);
}

import { Container, Stack } from "@mantine/core";
import { DownloadedStatsCards, DzMain } from "@packages/dzui";
import { useDaemon } from "../../hooks/useDaemon.ts";
import { _DownloadedModsTable } from "./_DownloadedModsTable.tsx";

export type DownloadedPageProps = {
	variant: "downloads" | "enabled" | "updates";
};

export function _DownloadedPage(props: DownloadedPageProps) {
	const { metrics } = useDaemon();

	return (
		<DzMain>
			<Container>
				<Stack py={"md"} gap={"xl"}>
					<DownloadedStatsCards
						enabled={metrics.value?.enabled}
						downloaded={metrics.value?.downloads}
						updates={metrics.value?.outdated}
					/>
					<_DownloadedModsTable variant={props.variant} />
				</Stack>
			</Container>
		</DzMain>
	);
}

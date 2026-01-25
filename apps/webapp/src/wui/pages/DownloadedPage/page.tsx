import { Container, Stack } from "@mantine/core";
import { DownloadedStatsCards, DzMain } from "@packages/dzui";
import { useDashboardMetrics } from "../../hooks/useDashboardMetrics.ts";
import { _DownloadedModsTable } from "./_DownloadedModsTable.tsx";

export type DownloadedPageProps = {
	variant: "downloads" | "enabled" | "updates";
};

export function _DownloadedPage(props: DownloadedPageProps) {
	const { enabled, outdated, downloads } = useDashboardMetrics();

	return (
		<DzMain>
			<Container>
				<Stack py={"md"} gap={"xl"}>
					<DownloadedStatsCards enabled={enabled} downloaded={downloads} updates={outdated} />
					<_DownloadedModsTable variant={props.variant} />
				</Stack>
			</Container>
		</DzMain>
	);
}

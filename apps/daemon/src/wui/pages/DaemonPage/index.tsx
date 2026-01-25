import "@packages/dzui/i18n";
import { Container, Skeleton, Stack } from "@mantine/core";
import { ModAndReleaseDataStatus, useGetAllDaemonReleases } from "@packages/clients/daemon";
import { AppIcons, DownloadedStatsCards, DzMain, ErrorState, useAppTranslation } from "@packages/dzui";
import { StatusCodes } from "http-status-codes";
import { match } from "ts-pattern";
import { _DownloadedModsTable } from "./_DownloadedModsTable.tsx";

export function DownloadedPage() {
	const { t } = useAppTranslation();
	const allDaemonReleases = useGetAllDaemonReleases();
	const downloaded = allDaemonReleases.data?.data.length ?? 0;
	const enabled =
		allDaemonReleases.data?.data.filter((release) => release.status === ModAndReleaseDataStatus.ENABLED).length ?? 0;

	return (
		<DzMain>
			<Container>
				<Stack py={"md"} gap={"xl"}>
					<DownloadedStatsCards enabled={enabled} downloaded={downloaded} withoutUpdates />
					{match(allDaemonReleases)
						.when(
							(query) => query.data?.status === StatusCodes.OK,
							(query) => <_DownloadedModsTable mods={query.data!.data} />,
						)
						.when(
							(query) => query.isLoading,
							() => <Skeleton height={200} radius="md" />,
						)
						.otherwise(() => (
							<ErrorState
								title={t("DAEMON_RELEASES_ERROR_TITLE")}
								description={t("DAEMON_RELEASES_ERROR_DESC")}
								icon={AppIcons.Error}
								withoutBorder
							/>
						))}
				</Stack>
			</Container>
		</DzMain>
	);
}

import { AppShell, Container, Stack, useComputedColorScheme } from "@mantine/core";
import { StatusCodes } from "http-status-codes";
import { sortBy } from "lodash";
import { ModAndReleaseDataStatus } from "../../_autogen/daemon_api.ts";
import { useDaemon } from "../../hooks/useDaemon.ts";
import { _DownloadedModsTable } from "./_DownloadedModsTable.tsx";
import { _StatsCards } from "./_StatsCards.tsx";

export type DownloadedPageProps = {
	variant: "downloads" | "enabled" | "updates";
};

export function _DownloadedPage(props: DownloadedPageProps) {
	const colorScheme = useComputedColorScheme();

	const { toggle, update, remove, enabledCount, downloadCount, downloads, latestVersions, outdatedCount } = useDaemon();

	let _subscriptions = sortBy(downloads, "modName");

	if (props.variant === "enabled") {
		_subscriptions = _subscriptions?.filter((sxn) => sxn.status === ModAndReleaseDataStatus.ENABLED);
	}

	if (props.variant === "updates") {
		_subscriptions = _subscriptions.filter((sxn) => {
			if (latestVersions.value?.status !== StatusCodes.OK) return false;
			const latest = latestVersions.value?.data.find((lv) => lv.mod_id === sxn.modId);
			return latest ? latest.version !== sxn.version : false;
		});
	}

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"}>
				<Stack py={"xl"} gap={"xl"}>
					<_StatsCards
						downloadCount={downloadCount || 0}
						enabledCount={enabledCount || 0}
						outdatedCount={outdatedCount || 0}
					/>
					<_DownloadedModsTable
						subscriptions={_subscriptions}
						latestVersions={latestVersions.value?.status === StatusCodes.OK ? latestVersions.value : null}
						onToggle={toggle}
						onUpdate={update}
						onRemove={remove}
					/>
				</Stack>
			</Container>
		</AppShell.Main>
	);
}

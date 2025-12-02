import {
	ActionIcon,
	AppShell,
	Checkbox,
	Container,
	Group,
	Menu,
	Progress,
	Stack,
	Table,
	Text,
	useComputedColorScheme,
} from "@mantine/core";
import { sortBy } from "lodash";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useAsyncFn } from "react-use";
import { getModById, getModReleaseById } from "../_autogen/api.ts";
import {
	addReleaseToDaemon,
	disableRelease,
	enableRelease,
	ModAndReleaseDataStatus,
	removeReleaseFromDaemon,
} from "../_autogen/daemon_api.ts";
import { EmptyState } from "../components/EmptyState.tsx";
import { StatCard } from "../components/StatCard.tsx";
import { useDaemonDownloads } from "../hooks/useDaemon.ts";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";
import { AppIcons } from "../icons.ts";
import { orDefaultValue } from "../utils/orDefaultValue.ts";
import { showErrorNotification } from "../utils/showErrorNotification.tsx";
import { showSuccessNotification } from "../utils/showSuccessNotification.tsx";

/**
 * Check if a mod subscription status can be toggled
 *
 * @param status The mod subscription status
 * @returns True if the status can be toggled, false otherwise
 */
function canBeToggled(status: ModAndReleaseDataStatus | null | undefined) {
	return status === ModAndReleaseDataStatus.ENABLED || status === ModAndReleaseDataStatus.DISABLED;
}

export type DownloadedPageProps = {
	variant: "downloads" | "enabled" | "updates";
};
export function DownloadedPage(props: DownloadedPageProps) {
	const { t } = useAppTranslation();
	const colorScheme = useComputedColorScheme();

	const { enabledCount, downloadCount, downloads, refetch, latestVersions } = useDaemonDownloads();

	const [, toggle] = useAsyncFn(
		async (releaseId: string) => {
			const sxn = downloads?.find((s) => s.releaseId === releaseId);
			if (!sxn) return;

			try {
				if (sxn.status === ModAndReleaseDataStatus.ENABLED) {
					await disableRelease(sxn.releaseId);
					await refetch();
					showSuccessNotification(t("MOD_DISABLED_SUCCESS_TITLE"), t("MOD_DISABLED_SUCCESS_DESC"));
				} else if (sxn.status === ModAndReleaseDataStatus.DISABLED) {
					await enableRelease(sxn.releaseId);
					await refetch();
					showSuccessNotification(t("MOD_ENABLED_SUCCESS_TITLE"), t("MOD_ENABLED_SUCCESS_DESC"));
				}
			} catch (e) {
				showErrorNotification(e);
			}
		},
		[downloads, refetch],
	);

	const [, remove] = useAsyncFn(
		async (releaseId: string) => {
			try {
				await removeReleaseFromDaemon(releaseId);
				await refetch();
				showSuccessNotification(t("REMOVE_SUCCESS_TITLE"), t("REMOVE_SUCCESS_DESC"));
			} catch (e) {
				showErrorNotification(e);
			}
		},
		[refetch],
	);

	const [, update] = useAsyncFn(
		async (modId: string, currentReleaseId: string, latestReleaseId: string) => {
			const mod = await getModById(modId);

			if (!mod.data || mod.status !== 200) {
				showErrorNotification(t("MOD_NOT_FOUND_ERROR"));
				return;
			}

			const latest = await getModReleaseById(modId, latestReleaseId);

			if (!latest.data || latest.status !== 200) {
				showErrorNotification(t("LATEST_RELEASE_NOT_FOUND_ERROR"));
				return;
			}

			try {
				await addReleaseToDaemon({
					modId: mod.data.id,
					releaseId: latest.data.id,
					modName: mod.data.name,
					version: latest.data.version,
					assets: latest.data.assets,
					dependencies: mod.data.dependencies,
					missionScripts: latest.data.missionScripts,
					symbolicLinks: latest.data.symbolicLinks,
				});
				await removeReleaseFromDaemon(currentReleaseId);
				await refetch();
			} catch (e) {
				showErrorNotification(e);
			}
		},
		[refetch],
	);

	let _subscriptions = sortBy(downloads, "modName");

	if (props.variant === "enabled") {
		_subscriptions = _subscriptions?.filter((sxn) => sxn.status === ModAndReleaseDataStatus.ENABLED);
	}

	if (props.variant === "updates") {
		_subscriptions = _subscriptions.filter((sxn) => {
			const latest = latestVersions.value?.data.find((lv) => lv.mod_id === sxn.modId);
			return latest ? latest.version !== sxn.version : false;
		});
	}

	const rows = _subscriptions?.map((sxn) => {
		const latest = latestVersions.value?.data.find((lv) => lv.mod_id === sxn.modId);

		const isLatest = latest ? latest.version === sxn.version : true;

		return (
			<Table.Tr key={sxn.modId}>
				<Table.Th>
					<Checkbox
						disabled={!canBeToggled(sxn.status)}
						checked={sxn.status === ModAndReleaseDataStatus.ENABLED}
						onChange={() => toggle(sxn.releaseId)}
					/>
				</Table.Th>
				<Table.Td>{sxn.modName}</Table.Td>
				<Table.Td>
					{
						<Text size={"sm"} c={isLatest ? "green" : "orange"} fw={isLatest ? "normal" : "bold"}>
							{sxn?.version}
						</Text>
					}
				</Table.Td>
				<Table.Td>{latest?.version}</Table.Td>
				<Table.Td>
					{sxn.status === ModAndReleaseDataStatus.IN_PROGRESS ? (
						<Progress value={sxn.overallPercentProgress || 0} striped={true} animated={true} />
					) : (
						t(sxn.status || "PENDING")
					)}
				</Table.Td>
				<Table.Td>
					<Menu>
						<Menu.Target>
							<ActionIcon variant={"default"}>
								<BsThreeDotsVertical />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown>
							{!isLatest && latest && (
								<Menu.Item onClick={() => update(sxn.modId, sxn.releaseId, latest.id)}>{t("UPDATE")}</Menu.Item>
							)}
							<Menu.Item disabled={!canBeToggled(sxn.status)} onClick={() => toggle(sxn.releaseId)}>
								{sxn.status === ModAndReleaseDataStatus.ENABLED ? t("DISABLE") : t("ENABLE")}
							</Menu.Item>
							<Menu.Item onClick={() => remove(sxn.releaseId)}>{t("REMOVE")}</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				</Table.Td>
			</Table.Tr>
		);
	});

	return (
		<AppShell.Main bg={colorScheme === "light" ? "gray.0" : "dark.8"}>
			<Container size={"xl"}>
				<Stack py={"xl"} gap={"xl"}>
					<Group>
						<StatCard
							icon={AppIcons.Downloaded}
							iconColor={"grape"}
							label={t("DOWNLOADED")}
							value={orDefaultValue(downloadCount, "-")}
						/>
						<StatCard
							icon={AppIcons.Enabled}
							iconColor={"green"}
							label={t("ENABLED")}
							value={orDefaultValue(enabledCount, "-")}
						/>
						<StatCard icon={AppIcons.Updates} iconColor={"orange"} label={t("UPDATES")} value={"-"} />
					</Group>
					<Stack>
						<Text fz={"lg"} fw={"bold"}>
							{t("DOWNLOADED")}
						</Text>
						{downloads?.length ? (
							<Table>
								<Table.Thead>
									<Table.Tr>
										<Table.Th w={100}>{t("ENABLED")}</Table.Th>
										<Table.Th>{t("MOD_NAME")}</Table.Th>
										<Table.Th>{t("VERSION")}</Table.Th>
										<Table.Th>{t("LATEST")}</Table.Th>
										<Table.Th>{t("STATUS")}</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>{rows}</Table.Tbody>
							</Table>
						) : (
							<EmptyState
								withoutBorder
								title={t("NO_MODS_DOWNLOADED_TITLE")}
								description={t("NO_MODS_DOWNLOADED_SUBTITLE_DESC")}
								icon={AppIcons.Mods}
							/>
						)}
					</Stack>
				</Stack>
			</Container>
		</AppShell.Main>
	);
}

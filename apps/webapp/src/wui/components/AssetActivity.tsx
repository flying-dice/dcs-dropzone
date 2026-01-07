import { ActionIcon, Indicator, Popover, Text } from "@mantine/core";
import { MdFileDownload, MdFileDownloadOff } from "react-icons/md";
import { match } from "ts-pattern";
import { useDaemon } from "../hooks/useDaemon.ts";
import { useAppTranslation } from "../i18n/useAppTranslation.ts";
import { AssetListItem } from "./AssetListItem.tsx";

export function AssetActivity() {
	const { t } = useAppTranslation();
	const daemon = useDaemon();

	return (
		<Popover>
			<Popover.Target>
				<Indicator withBorder processing disabled={!daemon.isActive}>
					<ActionIcon size={"lg"} variant={"light"} color={daemon.isSuccess ? "green" : "red"}>
						{daemon.isSuccess ? <MdFileDownload /> : <MdFileDownloadOff />}
					</ActionIcon>
				</Indicator>
			</Popover.Target>
			<Popover.Dropdown>
				{match(daemon)
					.when(
						(it) => it.isError,
						() => <Text size={"sm"}>{t("DAEMON_CONNECTION_ERROR")}</Text>,
					)
					.when(
						(it) => it.isFetching && !it.isSuccess,
						() => <Text size={"sm"}>{t("DAEMON_CONNECTING")}</Text>,
					)
					.when(
						(it) => it.isSuccess && it.active?.length === 0,
						() => (
							<Text c={"dimmed"} size={"sm"}>
								{t("NO_ACTIVE_DOWNLOADS")}
							</Text>
						),
					)
					.otherwise(() =>
						daemon.active?.map((mod) =>
							mod.assets.map((asset) => (
								<AssetListItem
									key={asset.name}
									name={asset.name}
									urls={asset.urls}
									isArchive={asset.isArchive}
									progressPercent={asset.statusData?.overallPercentProgress}
									status={asset.statusData?.status}
								/>
							)),
						),
					)}
			</Popover.Dropdown>
		</Popover>
	);
}

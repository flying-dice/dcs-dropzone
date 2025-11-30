import { ActionIcon, Indicator, Popover } from "@mantine/core";
import { FaDownload } from "react-icons/fa6";
import { useDaemonSubscriptions } from "../hooks/useDaemonSubscriber.ts";
import { AssetListItem } from "./AssetListItem.tsx";

export function AssetActivity() {
	const daemon = useDaemonSubscriptions();

	return (
		<Popover>
			<Popover.Target>
				<Indicator withBorder processing disabled={!daemon.isActive}>
					<ActionIcon size={"lg"} disabled={!daemon.isActive} variant={"light"}>
						<FaDownload />
					</ActionIcon>
				</Indicator>
			</Popover.Target>
			<Popover.Dropdown>
				{daemon.active?.map((mod) =>
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
				)}
			</Popover.Dropdown>
		</Popover>
	);
}

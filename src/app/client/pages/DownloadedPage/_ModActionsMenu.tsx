import { ActionIcon, Menu } from "@mantine/core";
import { BsThreeDotsVertical } from "react-icons/bs";
import { ModAndReleaseDataStatus } from "../../_autogen/daemon_api.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";
import type { LatestVersion } from "./_DownloadedModsTable.tsx";

/**
 * Check if a mod subscription status can be toggled
 *
 * @param status The mod subscription status
 * @returns True if the status can be toggled, false otherwise
 */
function canBeToggled(status: ModAndReleaseDataStatus | null | undefined) {
	return status === ModAndReleaseDataStatus.ENABLED || status === ModAndReleaseDataStatus.DISABLED;
}

export function _ModActionsMenu(props: {
	status: ModAndReleaseDataStatus | undefined;
	latest: LatestVersion | undefined;
	isLatest: boolean;
	hasUpdateInProgress: boolean;
	onToggle: () => void;
	onUpdate: () => void;
	onRemove: () => void;
}) {
	const { t } = useAppTranslation();
	const { status, latest, isLatest } = props;

	return (
		<Menu>
			<Menu.Target>
				<ActionIcon variant={"default"}>
					<BsThreeDotsVertical />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				{!isLatest && latest && (
					<Menu.Item disabled={props.hasUpdateInProgress} onClick={props.onUpdate}>
						{t("UPDATE")}
					</Menu.Item>
				)}
				<Menu.Item disabled={!canBeToggled(status)} onClick={props.onToggle}>
					{status === ModAndReleaseDataStatus.ENABLED ? t("DISABLE") : t("ENABLE")}
				</Menu.Item>
				<Menu.Item onClick={props.onRemove}>{t("REMOVE")}</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}

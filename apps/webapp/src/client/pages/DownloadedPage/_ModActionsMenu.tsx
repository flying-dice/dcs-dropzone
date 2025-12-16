import { ActionIcon, Menu } from "@mantine/core";
import { BsThreeDotsVertical } from "react-icons/bs";
import type { ModReleaseData } from "../../_autogen/api.ts";
import { type ModAndReleaseData, ModAndReleaseDataStatus } from "../../_autogen/daemon_api.ts";
import { useDaemon } from "../../hooks/useDaemon.ts";
import { useAppTranslation } from "../../i18n/useAppTranslation.ts";

/**
 * Check if a mod subscription status can be toggled
 *
 * @param status The mod subscription status
 * @returns True if the status can be toggled, false otherwise
 */
function canBeToggled(status: ModAndReleaseDataStatus | null | undefined) {
	return status === ModAndReleaseDataStatus.ENABLED || status === ModAndReleaseDataStatus.DISABLED;
}

export function _ModActionsMenu(props: { mod: ModAndReleaseData; latest?: ModReleaseData }) {
	const { t } = useAppTranslation();
	const { toggle, update, remove, updating } = useDaemon();

	const handleToggle = () => toggle(props.mod.releaseId);

	const handleUpdate = () => (props.latest ? update(props.mod.modId, props.mod.releaseId, props.latest.id) : null);

	const handleRemove = () => remove(props.mod.releaseId);

	const isLatest = props.latest ? props.latest.version === props.mod.version : null;

	return (
		<Menu>
			<Menu.Target>
				<ActionIcon variant={"subtle"}>
					<BsThreeDotsVertical />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				{!isLatest && props.latest && handleUpdate && (
					<Menu.Item disabled={updating.loading} onClick={handleUpdate}>
						{t("INSTALL_LATEST")}
					</Menu.Item>
				)}
				<Menu.Item disabled={!canBeToggled(props.mod.status)} onClick={handleToggle}>
					{props.mod.status === ModAndReleaseDataStatus.ENABLED ? t("DISABLE") : t("ENABLE")}
				</Menu.Item>
				<Menu.Item onClick={handleRemove}>{t("REMOVE")}</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}

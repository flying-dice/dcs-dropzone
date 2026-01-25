import { ActionIcon, Menu } from "@mantine/core";
import { type ModAndReleaseData, ModAndReleaseDataStatus } from "@packages/clients/daemon";
import type { ModReleaseData } from "@packages/clients/webapp";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useAsyncFn } from "react-use";
import { useAppTranslation } from "./useAppTranslation.ts";

function canBeToggled(status: ModAndReleaseDataStatus | null | undefined) {
	return status === ModAndReleaseDataStatus.ENABLED || status === ModAndReleaseDataStatus.DISABLED;
}

export type ModActionsMenuProps = {
	mod: ModAndReleaseData;

	onToggle: () => Promise<void>;
	onRemove: () => Promise<void>;

	latest?: ModReleaseData;
	isLatest?: boolean | undefined;
	onUpdate?: () => Promise<void>;
};

export function ModActionsMenu(props: ModActionsMenuProps) {
	const { t } = useAppTranslation();

	const [updating, handleUpdate] = useAsyncFn(async () => {
		if (props.onUpdate) {
			return await props.onUpdate();
		}
	}, [props.onUpdate]);

	const [toggling, handleToggle] = useAsyncFn(props.onToggle, [props.onToggle]);
	const [removing, handleRemove] = useAsyncFn(props.onRemove, [props.onRemove]);

	const canUpdate = props.onUpdate;
	const hasLatest = !!props.latest;
	const isOutdated = !props.isLatest;

	const updateDisabled = updating.loading;
	const toggleDisabled = toggling.loading || !canBeToggled(props.mod.status);
	const removeDisabled = removing.loading;

	return (
		<Menu>
			<Menu.Target>
				<ActionIcon variant={"subtle"}>
					<BsThreeDotsVertical />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				{canUpdate && hasLatest && isOutdated && (
					<Menu.Item disabled={updateDisabled} onClick={handleUpdate}>
						{t("INSTALL_LATEST")}
					</Menu.Item>
				)}
				<Menu.Item disabled={toggleDisabled} onClick={handleToggle}>
					{props.mod.status === ModAndReleaseDataStatus.ENABLED ? t("DISABLE") : t("ENABLE")}
				</Menu.Item>
				<Menu.Item disabled={removeDisabled} onClick={handleRemove}>
					{t("REMOVE")}
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}

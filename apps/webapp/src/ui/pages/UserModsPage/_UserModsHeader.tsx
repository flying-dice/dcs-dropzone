import { Button, Group } from "@mantine/core";
import { useAppTranslation } from "@packages/dzui";
import { FaPlus } from "react-icons/fa";

export function _UserModsHeader(props: { onNewMod: () => void }) {
	const { t } = useAppTranslation();

	return (
		<Group justify={"end"}>
			<Button data-testid="publish-new-mod-button" leftSection={<FaPlus />} onClick={props.onNewMod}>
				{t("PUBLISH_NEW_MOD")}
			</Button>
		</Group>
	);
}
